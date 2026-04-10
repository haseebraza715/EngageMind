import logging
import os
import sys
from functools import wraps

from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_pymongo import PyMongo

# Allow running as script: `python fine_tune/fine_tune_app.py`
if __package__ in (None, ""):
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fine_tune.celery_config import app as celery_app
from fine_tune.tasks.tasks import fine_tune_gpt2_lora
from rag.ingestion.ingestion_pipeline import process_binary_content, process_text_content
from rag.server.security import verify_api_token


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_FINE_TUNE_DIR = os.path.dirname(os.path.abspath(__file__))
_RAG_ROOT = os.path.dirname(_FINE_TUNE_DIR)
load_dotenv(os.path.join(_RAG_ROOT, ".env"), override=False)

app = Flask(__name__)
mongo_uri = os.getenv("MONGO_URL", "mongodb://localhost:27017/demo_db")
if "serverSelectionTimeoutMS" not in mongo_uri:
    joiner = "&" if "?" in mongo_uri else "?"
    mongo_uri = f"{mongo_uri}{joiner}serverSelectionTimeoutMS=5000&connectTimeoutMS=5000&socketTimeoutMS=5000"
app.config["MONGO_URI"] = mongo_uri
mongo = PyMongo(app)
db = mongo.db


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


@app.route("/api/fine-tune", methods=["POST"])
@login_required
def start_fine_tune():
    """Start fine-tuning GPT-2 with LoRA for the authenticated user."""
    user_id = g.user_id

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
                    "result": task.result if isinstance(task.result, dict) else {"value": task.result},
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

        return jsonify(payload), 200

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)
