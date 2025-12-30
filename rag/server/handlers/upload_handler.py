"""
Document upload handler.
"""

import logging
import os
import time
from typing import Any, Tuple

from bson.binary import Binary
from flask import jsonify

from rag.ingestion.ingestion_pipeline import (
    build_faiss_index,
    process_text_content,
    process_binary_content,
)
from rag.utils.upload_optimizer import optimized_add_document_to_index

logger = logging.getLogger(__name__)


def handle_document_upload(
    user_id: str,
    file,
    db,
    api_key: str,
    invalidate_cache_callback=None
) -> Tuple[Any, int]:
    """
    Handle document upload and index update.

    Args:
        user_id: User identifier
        file: Uploaded file from Flask request
        db: MongoDB database instance
        api_key: Mistral API key
        invalidate_cache_callback: Callback to invalidate document cache

    Returns:
        Tuple of (response, status_code)
    """
    if not file or file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    content = file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        return jsonify({"error": "File too large (max 10MB)"}), 413

    # Save to MongoDB
    document = {
        "user_id": user_id,
        "filename": file.filename,
        "content": Binary(content),
        "upload_date": int(time.time()),
        "file_size": len(content),
        "file_type": os.path.splitext(file.filename)[1].lower()
    }

    try:
        result = db.documents.insert_one(document)
        logger.info(f"User {user_id} uploaded {file.filename} ({len(content)} bytes)")

        # Process document
        ext = os.path.splitext(file.filename)[1].lower()
        if ext == ".txt":
            doc = process_text_content(content.decode('utf-8'), file.filename, user_id)
        else:
            from mistralai import Mistral
            mistral_client = Mistral(api_key=api_key)
            doc = process_binary_content(content, file.filename, user_id, mistral_client)

        if doc:
            # Use optimized incremental update
            success = optimized_add_document_to_index(user_id=user_id, document=doc, api_key=api_key)

            if success:
                # Invalidate cache after successful index update
                if invalidate_cache_callback:
                    invalidate_cache_callback(user_id)
                return jsonify({
                    "status": "success",
                    "message": "Document uploaded and indexed successfully",
                    "document_id": str(result.inserted_id)
                }), 200
            else:
                # Fall back to full rebuild
                logger.warning(f"Incremental update failed, rebuilding index for user {user_id}")
                build_faiss_index(user_id=user_id, mongo_collection=db.documents, api_key=api_key)
                # Invalidate cache after rebuild
                if invalidate_cache_callback:
                    invalidate_cache_callback(user_id)
                return jsonify({
                    "status": "success",
                    "message": "Document uploaded and index rebuilt",
                    "document_id": str(result.inserted_id)
                }), 200
        else:
            return jsonify({
                "status": "partial_success",
                "message": "Document saved but processing failed",
                "document_id": str(result.inserted_id)
            }), 202

    except Exception as e:
        logger.exception(f"Upload failed: {e}")
        return jsonify({"error": str(e)}), 500
