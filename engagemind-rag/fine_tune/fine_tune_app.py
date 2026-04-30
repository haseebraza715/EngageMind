import logging
import os
import sys
import time
from functools import wraps

from bson import ObjectId
from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS
from flask_pymongo import PyMongo

# Allow running as script: `python fine_tune/fine_tune_app.py`
if __package__ in (None, ""):
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fine_tune.celery_config import app as celery_app
from fine_tune.inference import check_adapter_availability, generate_lora_response
from fine_tune.tasks.tasks import fine_tune_gpt2_lora
from rag.ingestion.ingestion_pipeline import process_binary_content, process_text_content
from rag.server.security import verify_api_token


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_FINE_TUNE_DIR = os.path.dirname(os.path.abspath(__file__))
_RAG_ROOT = os.path.dirname(_FINE_TUNE_DIR)
load_dotenv(os.path.join(_RAG_ROOT, ".env"), override=False)

app = Flask(__name__)

cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": cors_origins,
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Authorization", "Content-Type"],
        }
    },
)

mongo_uri = os.getenv("MONGO_URL", "mongodb://localhost:27017/demo_db")
if "serverSelectionTimeoutMS" not in mongo_uri:
    joiner = "&" if "?" in mongo_uri else "?"
    mongo_uri = f"{mongo_uri}{joiner}serverSelectionTimeoutMS=5000&connectTimeoutMS=5000&socketTimeoutMS=5000"
app.config["MONGO_URI"] = mongo_uri
mongo = PyMongo(app)
db = mongo.db


def _json_safe(value):
    """Convert nested values to JSON-serializable primitives."""
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [_json_safe(v) for v in value]
    if isinstance(value, (bytes, bytearray)):
        return bytes(value).decode("utf-8", errors="ignore")
    return value


def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"status": "FAILURE", "message": "Unauthorized: missing token"}), 401

        token = auth_header.split(" ", 1)[1].strip()
        user_id = verify_api_token(token)
        if not user_id:
            return jsonify({"status": "FAILURE", "message": "Unauthorized: invalid or expired token"}), 401

        g.user_id = user_id
        return f(*args, **kwargs)

    return decorated_function


def _extract_training_texts(user_id: str):
    docs = db.documents.find({"user_id": user_id})
    dataset_texts = []

    for doc in docs:
        content = doc.get("content")
        if content is None:
            continue

        filename = doc.get("filename") or f"document_{doc.get('_id', '')}"
        file_type = (doc.get("file_type") or "").lower()
        extracted_doc = None

        if isinstance(content, str):
            extracted_doc = process_text_content(content, filename, user_id)
        else:
            try:
                raw_bytes = bytes(content)
            except Exception:
                logger.warning("[FINE-TUNE] Skipping unreadable document %s", filename)
                continue

            if file_type in {".txt", ".md"} or filename.lower().endswith((".txt", ".md")):
                extracted_doc = process_text_content(
                    raw_bytes.decode("utf-8", errors="ignore"),
                    filename,
                    user_id,
                )
            else:
                extracted_doc = process_binary_content(
                    raw_bytes,
                    filename,
                    user_id,
                    mistral_client=None,
                )

        if extracted_doc and extracted_doc.page_content.strip():
            dataset_texts.append(extracted_doc.page_content.strip())

    return dataset_texts


def _append_gpt2_lora_messages(user_id: str, conversation_id: str, user_msg: str, assistant_msg: str, model_id: str):
    timestamp = int(time.time())
    assistant_ts = int(time.time())

    db.chats.update_one(
        {"conversation_id": conversation_id, "user_id": user_id},
        {
            "$push": {
                "messages": {
                    "$each": [
                        {
                            "sender": "user",
                            "text": user_msg,
                            "timestamp": timestamp,
                            "provider": "gpt2-lora",
                            "model_id": model_id,
                        },
                        {
                            "sender": "assistant",
                            "text": assistant_msg,
                            "timestamp": assistant_ts,
                            "provider": "gpt2-lora",
                            "model_id": model_id,
                        },
                    ]
                }
            },
            "$set": {"updated_at": assistant_ts},
        },
        upsert=False,
    )


@app.route("/api/fine-tune", methods=["POST"])
@login_required
def start_fine_tune():
    """Start fine-tuning GPT-2 with LoRA for the authenticated user."""
    user_id = str(g.user_id)

    try:
        dataset_texts = _extract_training_texts(user_id=user_id)
        if not dataset_texts:
            logger.warning("[FINE-TUNE] No trainable corpus found for user %s", user_id)
            return jsonify(
                {
                    "status": "FAILURE",
                    "state": "FAILURE",
                    "message": "No uploaded document content found. Upload at least one readable document first.",
                }
            ), 400

        output_dir = os.path.join(_RAG_ROOT, "models", user_id, "gpt2-lora")
        os.makedirs(output_dir, exist_ok=True)

        task = fine_tune_gpt2_lora.delay(user_id, dataset_texts, output_dir)
        logger.info("[FINE-TUNE] Started task %s for user %s", task.id, user_id)

        return jsonify(
            {
                "task_id": task.id,
                "status": "PENDING",
                "state": "PENDING",
                "message": "Fine-tuning task queued.",
            }
        ), 202

    except Exception as e:
        logger.exception("[FINE-TUNE] Error starting fine-tuning for user %s: %s", user_id, e)
        return jsonify(
            {
                "status": "FAILURE",
                "state": "FAILURE",
                "message": "Failed to start fine-tuning task.",
                "error": str(e),
            }
        ), 500


@app.route("/api/fine-tune/status/<task_id>", methods=["GET"])
@login_required
def check_fine_tune_status(task_id):
    """Return deterministic status semantics for frontend polling."""
    try:
        task = celery_app.AsyncResult(task_id)
        raw_state = (task.state or "").upper()
        state = raw_state
        payload = {
            "task_id": task_id,
            "status": "PENDING",
            "state": "PENDING",
            "message": "Task is waiting to start.",
        }

        if raw_state in {"STARTED", "PROGRESS", "RETRY"}:
            meta = task.info if isinstance(task.info, dict) else {}
            payload.update(
                {
                    "status": "PROGRESS",
                    "state": "PROGRESS",
                    "message": meta.get("message") or meta.get("status") or "Training in progress.",
                }
            )
        elif raw_state == "SUCCESS":
            payload.update(
                {
                    "status": "SUCCESS",
                    "state": "SUCCESS",
                    "message": "Fine-tuning completed successfully.",
                    "result": _json_safe(task.result if isinstance(task.result, dict) else {"value": task.result}),
                }
            )
        elif raw_state == "FAILURE":
            meta = task.info if isinstance(task.info, dict) else {}
            error_message = meta.get("error") or str(task.info) or "Task failed."
            payload.update(
                {
                    "status": "FAILURE",
                    "state": "FAILURE",
                    "message": error_message,
                    "error": error_message,
                }
            )
        elif raw_state and raw_state != "PENDING":
            payload.update(
                {
                    "status": state,
                    "state": state,
                    "message": "Task is in an intermediate state.",
                }
            )

        return jsonify(_json_safe(payload)), 200

    except Exception as e:
        logger.exception("[FINE-TUNE] Error checking task %s: %s", task_id, e)
        return jsonify(
            {
                "task_id": task_id,
                "status": "FAILURE",
                "state": "FAILURE",
                "message": "Failed to fetch fine-tuning task status.",
                "error": str(e),
            }
        ), 500


@app.route("/api/fine-tune/model", methods=["GET"])
@login_required
def get_fine_tune_model():
    user_id = str(g.user_id)
    status = check_adapter_availability(user_id, db)
    status["status"] = "AVAILABLE" if status.get("available") else "UNAVAILABLE"
    return jsonify(_json_safe(status)), 200


@app.route("/api/fine-tune/chat", methods=["POST"])
@login_required
def fine_tune_chat():
    user_id = str(g.user_id)
    data = request.get_json(force=True, silent=True) or {}
    message = (data.get("message") or "").strip()
    conversation_id = (data.get("conversation_id") or "").strip() or None

    if not message:
        return jsonify({"status": "FAILURE", "message": "Message is required."}), 400

    if conversation_id:
        convo = db.chats.find_one({"conversation_id": conversation_id, "user_id": user_id})
        if not convo:
            return jsonify({"status": "FAILURE", "message": "Conversation not found."}), 404

    availability = check_adapter_availability(user_id, db)
    if not availability.get("available"):
        return (
            jsonify(
                {
                    "status": "UNAVAILABLE",
                    "message": availability.get("reason")
                    or "No GPT-2 LoRA adapter is available for this user.",
                }
            ),
            404,
        )

    try:
        answer, meta = generate_lora_response(user_id, message, db, status=availability)
    except Exception as e:
        logger.exception("[FINE-TUNE] Failed to generate response for user %s: %s", user_id, e)
        return (
            jsonify(
                {
                    "status": "FAILURE",
                    "message": "Failed to generate GPT-2 LoRA response.",
                }
            ),
            500,
        )

    if conversation_id:
        try:
            _append_gpt2_lora_messages(
                user_id=user_id,
                conversation_id=conversation_id,
                user_msg=message,
                assistant_msg=answer,
                model_id=meta.get("model_id"),
            )
        except Exception as e:
            logger.exception(
                "[FINE-TUNE] Failed to persist GPT-2 LoRA chat for user %s: %s", user_id, e
            )

    return jsonify(
        {
            "answer": answer,
            "provider": "gpt2-lora",
            "model_id": meta.get("model_id"),
            "status": "SUCCESS",
        }
    ), 200


if __name__ == "__main__":
    debug = os.getenv("FINE_TUNE_DEBUG", "false").lower() == "true"
    app.run(host="0.0.0.0", port=5002, debug=debug)
