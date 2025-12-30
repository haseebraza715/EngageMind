from flask import Flask, jsonify, g, request
from flask_pymongo import PyMongo
from rag.server.security import verify_api_token
from functools import wraps
import logging
import os
from rag.fine_tune.celery_config import app as celery_app
from rag.fine_tune.tasks.tasks import fine_tune_gpt2_lora

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config["MONGO_URI"] = "mongodb://localhost:27017/demo_db"
mongo = PyMongo(app)
db = mongo.db

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Unauthorized: Missing token"}), 401

        token = auth_header.split("Bearer ")[-1].strip()
        user_id = verify_api_token(token)
        if not user_id:
            return jsonify({"error": "Unauthorized: Invalid token"}), 401

        g.user_id = user_id
        return f(*args, **kwargs)
    return decorated_function

@app.route("/api/fine-tune", methods=["POST"])
@login_required
def start_fine_tune():
    """Start fine-tuning GPT-2 with LoRA for the user."""
    user_id = None
    try:
        user_id = g.user_id
        data = request.get_json() or {}
        # Extract dataset from uploaded documents in MongoDB
        docs = db.documents.find({"user_id": user_id})
        dataset_texts = [doc["content"] for doc in docs if "content" in doc]

        if not dataset_texts:
            logger.warning(f"[FINE-TUNE] No documents found for user {user_id}")
            return jsonify({
                "message": "hi, please upload some documents to provide context for fine-tuning."
            }), 400

        # Define output directory for model checkpoints
        output_dir = f"./models/{user_id}/gpt2-lora"
        os.makedirs(output_dir, exist_ok=True)

        # Trigger Celery task
        task = fine_tune_gpt2_lora.delay(user_id, dataset_texts, output_dir)

        logger.info(f"[FINE-TUNE] Started task {task.id} for user {user_id}")
        return jsonify({"task_id": task.id, "status": "Task started"}), 202

    except Exception as e:
        logger.exception(f"[FINE-TUNE] Error starting fine-tuning for user {user_id or 'unknown'}: {e}")

        return jsonify({
            "message": "hi, something went wrong. Please try again or upload documents."
        }), 500

@app.route("/api/fine-tune/status/<task_id>", methods=["GET"])
@login_required
def check_fine_tune_status(task_id):
    """Check the status of a fine-tuning task."""
    try:
        task = fine_tune_gpt2_lora.AsyncResult(task_id)
        if task.state == "PENDING":
            response = {"status": "Pending", "info": "Task is waiting to start"}
        elif task.state == "PROGRESS":
            response = {"status": "In Progress", "info": task.info.get("status", "Training")}
        elif task.state == "SUCCESS":
            response = {"status": "Completed", "info": task.result}
        elif task.state == "FAILURE":
            response = {"status": "Failed", "info": task.info.get("error", "Unknown error")}
        else:
            response = {"status": task.state, "info": "Unknown state"}
        return jsonify(response), 200

    except Exception as e:
        logger.exception(f"[FINE-TUNE] Error checking task {task_id}: {e}")
        return jsonify({
            "message": "hi, something went wrong. Please try again."
        }), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)
