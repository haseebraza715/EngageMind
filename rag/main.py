import os
from flask import Flask
from flask_pymongo import PyMongo
from rag.server.app import register_routes
from config import MONGO_URL, FAISS_INDEX_ROOT, MISTRAL_API_KEY
from logger_setup import setup_logger
from rag.ingestion.ingestion_pipeline import build_faiss_index
from rag.retrieval.retrieval_pipeline import build_retrieval_chain

# Ensure this file lives at: Thesis/rag/main.py

def create_app() -> Flask:
    # Configure logging first
    setup_logger()

    # Initialize Flask app
    app = Flask(__name__, static_folder="../static", static_url_path="/")

    # Configure MongoDB
    app.config["MONGO_URI"] = MONGO_URL
    mongo = PyMongo(app)

    # Build or verify FAISS index directory
    os.makedirs(FAISS_INDEX_ROOT, exist_ok=True)

    # Build the retrieval chain (uses Mistral & FAISS)
    logger = app.logger
    try:
        retrieval_chain = build_retrieval_chain(FAISS_INDEX_ROOT, MISTRAL_API_KEY)
        # Attach to app for route handlers
        app.retrieval_chain = retrieval_chain
        logger.info("[INIT] Retrieval chain attached to app.")
    except Exception as e:
        logger.error(f"[INIT] Could not build retrieval chain: {e}")
        raise

    # Optionally, index any new documents on startup
    # build_faiss_index(input_files=None, api_key=MISTRAL_API_KEY,
    #                   save_path=FAISS_INDEX_ROOT,
    #                   mongo_collection=mongo.db.documents)

    # Register all route handlers
    register_routes(app, mongo)

    return app
