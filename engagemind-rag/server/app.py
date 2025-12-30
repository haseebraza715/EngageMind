"""
RAG Pipeline Server - Main Flask application.
"""

import logging
import os
import time
from copy import deepcopy
from typing import Optional

from flask import Flask, g, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_pymongo import PyMongo, pymongo
from dotenv import load_dotenv
from cachetools import TTLCache
from langchain_core.documents import Document

from rag.retrieval.retrieval_pipeline import build_retrieval_chain
from rag.server.security import login_required
from rag.server.workflows.langgraph_workflow import build_conversation_graph
from rag.server.handlers.conversation_handler import (
    create_new_conversation,
    get_conversation_by_id,
    list_user_conversations,
    delete_conversation_by_id
)
from rag.server.handlers.message_handler import handle_message
from rag.server.handlers.upload_handler import handle_document_upload

# Optional Tavily for web fallback
try:
    from tavily import TavilyClient
    TAVILY_AVAILABLE = True
except ImportError:
    TAVILY_AVAILABLE = False

# ============================================================================
# LOGGING SETUP
# ============================================================================

LOG_FORMAT = "[%(asctime)s] [%(levelname)s] %(name)s - %(message)s"
logging.basicConfig(format=LOG_FORMAT, level=logging.INFO, handlers=[logging.StreamHandler()])
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

load_dotenv()
api_key = os.getenv("MISTRAL_API_KEY")
tavily_api_key = os.getenv("TAVILY_API_KEY")

if not api_key:
    raise ValueError("MISTRAL_API_KEY must be set in .env")

# Initialize Tavily client if available
tavily = None
if TAVILY_AVAILABLE and tavily_api_key:
    tavily = TavilyClient(api_key=tavily_api_key)
    logger.info("Tavily web search enabled")
else:
    logger.warning("Tavily web search disabled (no API key or package not installed)")

# MongoDB connection
mongodb_client = pymongo.MongoClient(os.getenv("MONGO_URL", "mongodb://localhost:27017/"))
state_db = mongodb_client["demo_db"]
state_collection = state_db["conversation_states"]

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_DIR = os.path.join(BASE_DIR, "..", "faiss_index_dir")


# ============================================================================
# DOCUMENT INDEX CACHE
# ============================================================================

_index_existence_cache = TTLCache(maxsize=1000, ttl=60)


def user_has_documents(user_id: str) -> bool:
    """Check if user has documents with caching."""
    if user_id in _index_existence_cache:
        return _index_existence_cache[user_id]

    user_dir = os.path.join(INDEX_DIR, user_id)
    has_docs = os.path.exists(user_dir) and \
               os.path.exists(os.path.join(user_dir, "index.faiss"))

    _index_existence_cache[user_id] = has_docs
    return has_docs


def invalidate_document_cache(user_id: str):
    """Invalidate cache after document upload."""
    if user_id in _index_existence_cache:
        del _index_existence_cache[user_id]
        logger.debug(f"[CACHE] Invalidated document cache for user {user_id}")


# ============================================================================
# STATE PERSISTENCE
# ============================================================================

def document_to_dict(doc: Document) -> dict:
    return {"page_content": doc.page_content, "metadata": doc.metadata}


def dict_to_document(doc_dict: dict) -> Document:
    return Document(page_content=doc_dict["page_content"], metadata=doc_dict["metadata"])


def save_state(thread_id: str, state: dict) -> bool:
    """Save conversation state to MongoDB."""
    try:
        state_dict = deepcopy(state)

        # Serialize Documents
        if "context" in state_dict and "documents" in state_dict["context"]:
            state_dict["context"]["documents"] = [
                document_to_dict(doc) if isinstance(doc, Document) else doc
                for doc in state_dict["context"]["documents"]
            ]

        document = {
            "thread_id": thread_id,
            "state": state_dict,
            "updated_at": int(time.time())
        }

        state_collection.update_one(
            {"thread_id": thread_id},
            {"$set": document},
            upsert=True
        )

        logger.debug(f"Saved state for thread {thread_id}")
        return True

    except Exception as e:
        logger.exception(f"Error saving state: {e}")
        return False


def load_state(thread_id: str) -> Optional[dict]:
    """Load conversation state from MongoDB."""
    try:
        state_doc = state_collection.find_one({"thread_id": thread_id})
        if not state_doc or "state" not in state_doc:
            return None

        state = deepcopy(state_doc["state"])

        # Deserialize Documents
        if "context" in state and "documents" in state["context"]:
            state["context"]["documents"] = [
                dict_to_document(d) for d in state["context"]["documents"]
                if isinstance(d, dict) and "page_content" in d
            ]

        return state

    except Exception as e:
        logger.exception(f"Error loading state: {e}")
        return None


def delete_thread(thread_id: str) -> None:
    """Delete a conversation thread."""
    state_collection.delete_one({"thread_id": thread_id})
    logger.info(f"Deleted thread {thread_id}")


# ============================================================================
# BUILD CONVERSATION GRAPH
# ============================================================================

skip_quality_checks = os.getenv("SKIP_QUALITY_CHECKS", "true").lower() == "true"
conversation_graph = build_conversation_graph(
    api_key=api_key,
    retrieval_chain_factory=build_retrieval_chain,
    tavily=tavily,
    skip_quality_checks=skip_quality_checks
)


# ============================================================================
# FLASK ROUTES
# ============================================================================

def register_routes(app, mongo):
    db = mongo.db

    @app.route("/", methods=["GET"])
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/api/health", methods=["GET"])
    def health():
        """
        Comprehensive health check endpoint - Phase 4.1

        Checks:
        - MongoDB connectivity
        - Mistral API availability
        - FAISS index directory
        - Circuit breaker states
        """
        from datetime import datetime
        from rag.server.circuit_breaker import get_circuit_states

        checks = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'checks': {}
        }

        # MongoDB check
        try:
            mongodb_client.admin.command('ping')
            checks['checks']['mongodb'] = 'up'
        except Exception as e:
            checks['checks']['mongodb'] = f'down: {str(e)[:100]}'
            checks['status'] = 'unhealthy'

        # Mistral API check (lightweight - just check API key exists)
        if api_key:
            checks['checks']['mistral_api'] = 'configured'
        else:
            checks['checks']['mistral_api'] = 'not_configured'
            checks['status'] = 'degraded'

        # FAISS index directory check
        try:
            if os.path.exists(INDEX_DIR):
                user_dirs = [d for d in os.listdir(INDEX_DIR) if os.path.isdir(os.path.join(INDEX_DIR, d))]
                checks['checks']['faiss_indexes'] = f'{len(user_dirs)} user indexes'
            else:
                checks['checks']['faiss_indexes'] = 'directory_not_found'
        except Exception as e:
            checks['checks']['faiss_indexes'] = f'error: {str(e)[:100]}'

        # Circuit breaker states
        try:
            circuit_states = get_circuit_states()
            checks['checks']['circuit_breakers'] = {
                name: state['state']
                for name, state in circuit_states.items()
            }
        except Exception as e:
            checks['checks']['circuit_breakers'] = f'error: {str(e)[:100]}'

        # Set appropriate status code
        status_code = 200 if checks['status'] == 'healthy' else 503
        return jsonify(checks), status_code

    @app.route("/api/ask", methods=["POST"])
    @login_required
    def ask():
        """Simple Q&A endpoint (legacy)."""
        user_id = g.user_id
        data = request.get_json(force=True)
        question = data.get("question", "").strip()

        if not question:
            return jsonify({"answer": "Please provide a valid question."}), 400

        try:
            result = build_retrieval_chain(user_id=user_id, api_key=api_key)
            chain = result["chain"]
            response = chain.invoke({"input": question})

            if hasattr(response, 'content'):
                answer = response.content
            else:
                answer = str(response)

            return jsonify({"answer": answer}), 200

        except Exception as e:
            logger.exception(f"[Q&A] Error: {e}")
            return jsonify({"error": str(e)}), 500

    @app.route("/api/upload", methods=["POST"])
    @login_required
    def upload_document():
        """Upload a document and update the FAISS index."""
        user_id = g.user_id

        if "file" not in request.files:
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        return handle_document_upload(
            user_id=user_id,
            file=file,
            db=db,
            api_key=api_key,
            invalidate_cache_callback=invalidate_document_cache
        )

    @app.route("/api/conversation", methods=["POST"])
    @login_required
    def create_conversation():
        """Create a new conversation."""
        user_id = g.user_id
        data = request.get_json(force=True, silent=True) or {}
        custom_name = data.get("name", "").strip()
        initial_message = data.get("initial_message", "").strip()

        return create_new_conversation(
            user_id=user_id,
            db=db,
            api_key=api_key,
            custom_name=custom_name,
            initial_message=initial_message
        )

    @app.route("/api/conversation/<conversation_id>/message", methods=["POST"])
    @login_required
    def send_message(conversation_id: str):
        """Send a message and get an AI response."""
        user_id = g.user_id
        data = request.get_json(force=True, silent=True)
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400

        user_msg = data.get("message", "").strip()

        return handle_message(
            user_id=user_id,
            conversation_id=conversation_id,
            user_msg=user_msg,
            db=db,
            api_key=api_key,
            conversation_graph=conversation_graph,
            user_has_documents_callback=user_has_documents,
            load_state_callback=load_state,
            save_state_callback=save_state
        )

    @app.route("/api/conversation/<conversation_id>", methods=["GET"])
    @login_required
    def get_conversation(conversation_id: str):
        """Get a conversation."""
        user_id = g.user_id
        return get_conversation_by_id(user_id, conversation_id, db, api_key)

    @app.route("/api/conversations", methods=["GET"])
    @login_required
    def list_conversations():
        """List all conversations for a user."""
        user_id = g.user_id
        return list_user_conversations(user_id, db, api_key)

    @app.route("/api/conversation/<conversation_id>", methods=["DELETE"])
    @login_required
    def delete_conversation(conversation_id: str):
        """Delete a conversation."""
        user_id = g.user_id
        return delete_conversation_by_id(user_id, conversation_id, db, delete_thread)

    @app.route("/api/index/stats", methods=["GET"])
    @login_required
    def get_index_stats():
        """Get FAISS index statistics for the current user."""
        from rag.ingestion.ingestion_pipeline import get_index_stats
        user_id = g.user_id
        stats = get_index_stats(user_id)
        return jsonify(stats), 200


# ============================================================================
# APP FACTORY
# ============================================================================

def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__, static_folder="../../static", static_url_path="/")

    # CORS
    cors_origins = os.getenv("CORS_ORIGINS", "*")
    CORS(app, resources={
        r"/api/*": {
            "origins": cors_origins.split(",") if "," in cors_origins else cors_origins
        }
    })

    # MongoDB
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017/demo_db")
    app.config["MONGO_URI"] = mongo_url
    mongo = PyMongo(app)

    with app.app_context():
        # Create indexes
        mongo.db.documents.create_index([("user_id", pymongo.ASCENDING)])
        mongo.db.chats.create_index([
            ("user_id", pymongo.ASCENDING),
            ("conversation_id", pymongo.ASCENDING)
        ], unique=True)
        mongo.db.chats.create_index([("updated_at", pymongo.DESCENDING)])

    # Rate limiting
    default_limits = os.getenv("RATE_LIMITS", "100 per minute, 2000 per hour").split(",")
    limiter = Limiter(
        key_func=get_remote_address,
        app=app,
        default_limits=default_limits,
        storage_uri=mongo_url
    )

    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({"error": "Rate limit exceeded", "message": str(e.description)}), 429

    register_routes(app, mongo)

    # Logging level
    if os.getenv("FLASK_ENV") == "production":
        app.logger.setLevel(logging.INFO)
    else:
        app.logger.setLevel(logging.DEBUG)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5001, debug=True)
