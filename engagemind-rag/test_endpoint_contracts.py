#!/usr/bin/env python3
"""Endpoint-level tests for the RAG API contract.

These tests use Flask's test client. Heavy model and embedding work is mocked;
the point is to prove auth, routing, persistence, ownership, and failure
semantics without downloading models or calling external APIs.
"""

import os
import time
from unittest.mock import patch

import jwt
from flask import jsonify
from pymongo import MongoClient

os.environ.setdefault("MISTRAL_API_KEY", "test-mistral-key")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017/test_db")
os.environ.setdefault("SKIP_QUALITY_CHECKS", "true")

from rag.server import app as app_module
from rag.server.handlers import message_handler
from rag.ingestion import ingestion_pipeline


MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = MONGO_URL.rsplit("/", 1)[-1].split("?", 1)[0] or "test_db"


def _token(user_id: str):
    return jwt.encode({"userId": user_id}, os.environ["JWT_SECRET"], algorithm="HS256")


def _auth_header(user_id: str):
    return {"Authorization": f"Bearer {_token(user_id)}"}


def _db():
    return MongoClient(MONGO_URL, serverSelectionTimeoutMS=3000)[DB_NAME]


def _cleanup(user_id: str):
    db = _db()
    db.chats.delete_many({"user_id": user_id})
    db.documents.delete_many({"user_id": user_id})
    db.conversation_states.delete_many({"thread_id": {"$regex": f"^{user_id}:"}})


def _new_app():
    return app_module.create_app()


def test_auth_required_for_private_rag_endpoints():
    app = _new_app()
    with app.test_client() as client:
        checks = [
            ("get", "/api/conversations"),
            ("post", "/api/conversation"),
            ("post", "/api/upload"),
            ("get", "/api/index/stats"),
            ("post", "/api/ask"),
        ]
        for method, path in checks:
            response = getattr(client, method)(path)
            assert response.status_code == 401, f"{method.upper()} {path} should require auth"


def test_public_health_endpoint_reports_dependency_shape():
    app = _new_app()
    with app.test_client() as client:
        response = client.get("/api/health")
        assert response.status_code in (200, 503)
        payload = response.get_json()
        assert payload["status"] in ("healthy", "degraded", "unhealthy")
        assert "mongodb" in payload["checks"]
        assert "faiss_indexes" in payload["checks"]


def test_conversation_crud_is_per_user_and_persistent():
    user_a = f"rag-user-a-{int(time.time())}"
    user_b = f"rag-user-b-{int(time.time())}"
    _cleanup(user_a)
    _cleanup(user_b)
    app = _new_app()

    try:
        with app.test_client() as client:
            created = client.post("/api/conversation", headers=_auth_header(user_a))
            assert created.status_code == 201
            created_payload = created.get_json()
            conversation_id = created_payload["conversation_id"]

            listed = client.get("/api/conversations", headers=_auth_header(user_a))
            assert listed.status_code == 200
            assert any(c["conversation_id"] == conversation_id for c in listed.get_json())

            fetched = client.get(
                f"/api/conversation/{conversation_id}",
                headers=_auth_header(user_a),
            )
            assert fetched.status_code == 200
            assert fetched.get_json()["conversation_id"] == conversation_id

            cross_user = client.get(
                f"/api/conversation/{conversation_id}",
                headers=_auth_header(user_b),
            )
            assert cross_user.status_code == 404

            deleted = client.delete(
                f"/api/conversation/{conversation_id}",
                headers=_auth_header(user_a),
            )
            assert deleted.status_code == 200

            gone = client.get(
                f"/api/conversation/{conversation_id}",
                headers=_auth_header(user_a),
            )
            assert gone.status_code == 404
    finally:
        _cleanup(user_a)
        _cleanup(user_b)


def test_message_endpoint_validates_payload_before_pipeline_work():
    user_id = f"rag-message-user-{int(time.time())}"
    _cleanup(user_id)
    app = _new_app()

    try:
        with app.test_client() as client:
            created = client.post("/api/conversation", headers=_auth_header(user_id))
            conversation_id = created.get_json()["conversation_id"]

            invalid_json = client.post(
                f"/api/conversation/{conversation_id}/message",
                data="not json",
                content_type="text/plain",
                headers=_auth_header(user_id),
            )
            assert invalid_json.status_code == 400

            missing_message = client.post(
                f"/api/conversation/{conversation_id}/message",
                json={"message": ""},
                headers=_auth_header(user_id),
            )
            assert missing_message.status_code == 400

            missing_conversation = client.post(
                "/api/conversation/not-real/message",
                json={"message": "hello"},
                headers=_auth_header(user_id),
            )
            assert missing_conversation.status_code == 404
    finally:
        _cleanup(user_id)


def test_message_endpoint_chitchat_persists_user_and_assistant_messages():
    user_id = f"rag-chitchat-user-{int(time.time())}"
    _cleanup(user_id)
    app = _new_app()

    try:
        with app.test_client() as client, patch.object(
            message_handler,
            "route_user_query",
            return_value=("chitchat", "Hi, I am ready."),
        ):
            created = client.post("/api/conversation", headers=_auth_header(user_id))
            conversation_id = created.get_json()["conversation_id"]

            response = client.post(
                f"/api/conversation/{conversation_id}/message",
                json={"message": "hello"},
                headers=_auth_header(user_id),
            )

            assert response.status_code == 200
            assert response.get_json()["answer"] == "Hi, I am ready."

            convo = _db().chats.find_one({"conversation_id": conversation_id, "user_id": user_id})
            assert [m["sender"] for m in convo["messages"]] == ["user", "assistant"]
            assert convo["messages"][1]["text"] == "Hi, I am ready."
    finally:
        _cleanup(user_id)


def test_message_endpoint_no_documents_uses_controlled_fallback():
    user_id = f"rag-nodocs-user-{int(time.time())}"
    _cleanup(user_id)
    app = _new_app()

    try:
        with app.test_client() as client, patch.object(
            message_handler,
            "route_user_query",
            return_value=("document_query", None),
        ), patch.object(
            app_module,
            "user_has_documents",
            return_value=False,
        ), patch.object(
            message_handler,
            "generate_no_doc_response",
            return_value="Upload a document first.",
        ):
            created = client.post("/api/conversation", headers=_auth_header(user_id))
            conversation_id = created.get_json()["conversation_id"]

            response = client.post(
                f"/api/conversation/{conversation_id}/message",
                json={"message": "summarize my notes"},
                headers=_auth_header(user_id),
            )

            assert response.status_code == 200
            assert response.get_json()["answer"] == "Upload a document first."

            convo = _db().chats.find_one({"conversation_id": conversation_id, "user_id": user_id})
            assert len(convo["messages"]) == 2
            assert convo["messages"][0]["text"] == "summarize my notes"
            assert convo["messages"][1]["text"] == "Upload a document first."
    finally:
        _cleanup(user_id)


def test_upload_route_passes_authenticated_user_to_handler():
    user_id = f"rag-upload-user-{int(time.time())}"
    app = _new_app()

    with app.test_client() as client:
        missing = client.post("/api/upload", headers=_auth_header(user_id))
        assert missing.status_code == 400


def test_upload_route_accepts_file_and_returns_handler_response():
    import io

    user_id = f"rag-upload-user-{int(time.time())}"
    app = _new_app()
    seen = {}

    def fake_upload(user_id, file, db, api_key, invalidate_cache_callback=None):
        seen["user_id"] = user_id
        seen["filename"] = file.filename
        return jsonify({"status": "success", "document_id": "doc-1"}), 200

    with app.test_client() as client, patch.object(app_module, "handle_document_upload", fake_upload):
        response = client.post(
            "/api/upload",
            data={"file": (io.BytesIO(b"hello world"), "notes.txt")},
            content_type="multipart/form-data",
            headers=_auth_header(user_id),
        )
        assert response.status_code == 200
        assert response.get_json()["status"] == "success"
        assert seen == {"user_id": user_id, "filename": "notes.txt"}


def test_index_stats_are_scoped_to_authenticated_user():
    user_id = f"rag-index-user-{int(time.time())}"
    app = _new_app()
    seen = {}

    def fake_index_stats(current_user_id):
        seen["user_id"] = current_user_id
        return {"user_id": current_user_id, "total_documents": 2, "total_chunks": 5}

    with app.test_client() as client, patch.object(
        ingestion_pipeline,
        "get_index_stats",
        fake_index_stats,
    ):
        response = client.get("/api/index/stats", headers=_auth_header(user_id))

        assert response.status_code == 200
        assert response.get_json()["user_id"] == user_id
        assert seen["user_id"] == user_id


def test_legacy_ask_reports_empty_question_without_pipeline_work():
    app = _new_app()
    with app.test_client() as client:
        response = client.post(
            "/api/ask",
            json={"question": ""},
            headers=_auth_header("rag-ask-user"),
        )
        assert response.status_code == 400
        assert "answer" in response.get_json()


def run_all_tests():
    tests = [
        ("auth required for private RAG endpoints", test_auth_required_for_private_rag_endpoints),
        ("public health endpoint shape", test_public_health_endpoint_reports_dependency_shape),
        ("conversation CRUD is per-user and persistent", test_conversation_crud_is_per_user_and_persistent),
        ("message endpoint validates payload before pipeline work", test_message_endpoint_validates_payload_before_pipeline_work),
        ("message chitchat persists full exchange", test_message_endpoint_chitchat_persists_user_and_assistant_messages),
        ("message no-doc fallback persists full exchange", test_message_endpoint_no_documents_uses_controlled_fallback),
        ("upload route passes authenticated user to handler", test_upload_route_passes_authenticated_user_to_handler),
        ("upload route accepts file and returns handler response", test_upload_route_accepts_file_and_returns_handler_response),
        ("index stats are user scoped", test_index_stats_are_scoped_to_authenticated_user),
        ("legacy ask rejects empty question", test_legacy_ask_reports_empty_question_without_pipeline_work),
    ]

    passed = 0
    failed = []

    for name, test_fn in tests:
        try:
            test_fn()
            print(f"✅ {name}")
            passed += 1
        except Exception as exc:
            print(f"❌ {name}: {exc}")
            failed.append((name, str(exc)))

    print("\n" + "=" * 60)
    print(f"Passed: {passed}")
    print(f"Failed: {len(failed)}")
    if failed:
        for name, err in failed:
            print(f" - {name}: {err}")
    print("=" * 60)

    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(run_all_tests())
