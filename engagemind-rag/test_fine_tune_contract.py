#!/usr/bin/env python3
"""Requirement-driven tests for fine-tune API contract semantics."""

import os
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import jwt
from bson import ObjectId

# Ensure required env vars exist before importing app modules.
os.environ.setdefault("MISTRAL_API_KEY", "test-mistral-key")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017/test_db")

from fine_tune.fine_tune_app import app
from fine_tune.inference import _extract_assistant_answer


def _auth_header(user_id: str = "test-user"):
    token = jwt.encode({"userId": user_id}, os.environ["JWT_SECRET"], algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}


def test_start_fine_tune_requires_corpus():
    with app.test_client() as client, patch(
        "fine_tune.fine_tune_app._extract_training_texts", return_value=[]
    ):
        response = client.post("/api/fine-tune", headers=_auth_header())
        assert response.status_code == 400
        payload = response.get_json()
        assert payload["status"] == "FAILURE"
        assert payload["state"] == "FAILURE"


def test_start_fine_tune_requires_authentication():
    with app.test_client() as client:
        missing = client.post("/api/fine-tune")
        assert missing.status_code == 401
        assert missing.get_json()["status"] == "FAILURE"

        invalid = client.post(
            "/api/fine-tune",
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert invalid.status_code == 401
        assert invalid.get_json()["status"] == "FAILURE"


def test_start_fine_tune_success_contract():
    fake_task = SimpleNamespace(id="task-123")

    with app.test_client() as client, patch(
        "fine_tune.fine_tune_app._extract_training_texts", return_value=["doc one", "doc two"]
    ), patch(
        "fine_tune.fine_tune_app.fine_tune_gpt2_lora.delay", return_value=fake_task
    ):
        response = client.post("/api/fine-tune", headers=_auth_header())
        assert response.status_code == 202
        payload = response.get_json()
        assert payload["task_id"] == "task-123"
        assert payload["status"] == "PENDING"
        assert payload["state"] == "PENDING"


def test_status_mapping_contract():
    pending = SimpleNamespace(state="PENDING", info=None, result=None)
    progress = SimpleNamespace(state="PROGRESS", info={"message": "Training in progress"}, result=None)
    success = SimpleNamespace(
        state="SUCCESS",
        info=None,
        result={"output_dir": "./models/u/gpt2-lora", "trained_samples": 2},
    )
    failure = SimpleNamespace(state="FAILURE", info={"error": "bad corpus"}, result=None)

    scenarios = [
        (pending, "PENDING"),
        (progress, "PROGRESS"),
        (success, "SUCCESS"),
        (failure, "FAILURE"),
    ]

    with app.test_client() as client:
        for task_obj, expected_status in scenarios:
            with patch("fine_tune.fine_tune_app.celery_app.AsyncResult", return_value=task_obj):
                response = client.get(
                    "/api/fine-tune/status/task-abc",
                    headers=_auth_header(),
                )
                assert response.status_code == 200
                payload = response.get_json()
                assert payload["status"] == expected_status
                assert payload["state"] == expected_status


def test_status_requires_authentication():
    with app.test_client() as client:
        missing = client.get("/api/fine-tune/status/task-abc")
        assert missing.status_code == 401

        invalid = client.get(
            "/api/fine-tune/status/task-abc",
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert invalid.status_code == 401


def test_model_status_requires_authentication():
    with app.test_client() as client:
        missing = client.get("/api/fine-tune/model")
        assert missing.status_code == 401

        invalid = client.get(
            "/api/fine-tune/model",
            headers={"Authorization": "Bearer not-a-real-token"},
        )
        assert invalid.status_code == 401


def test_model_status_unavailable_contract():
    with app.test_client() as client, patch(
        "fine_tune.fine_tune_app.check_adapter_availability",
        return_value={"available": False, "reason": "No adapter"},
    ):
        response = client.get("/api/fine-tune/model", headers=_auth_header())
        assert response.status_code == 200
        payload = response.get_json()
        assert payload["available"] is False
        assert payload["status"] == "UNAVAILABLE"


def test_fine_tune_chat_requires_authentication():
    with app.test_client() as client:
        missing = client.post("/api/fine-tune/chat", json={"message": "Hi"})
        assert missing.status_code == 401

        invalid = client.post(
            "/api/fine-tune/chat",
            headers={"Authorization": "Bearer not-a-real-token"},
            json={"message": "Hi"},
        )
        assert invalid.status_code == 401


def test_fine_tune_chat_unavailable_returns_404():
    with app.test_client() as client, patch(
        "fine_tune.fine_tune_app.check_adapter_availability",
        return_value={"available": False, "reason": "No adapter"},
    ):
        response = client.post(
            "/api/fine-tune/chat",
            headers=_auth_header(),
            json={"message": "Hello"},
        )
        assert response.status_code == 404
        payload = response.get_json()
        assert payload["status"] == "UNAVAILABLE"


def test_fine_tune_chat_rejects_empty_message():
    with app.test_client() as client:
        response = client.post(
            "/api/fine-tune/chat",
            headers=_auth_header(),
            json={"message": "   "},
        )

        assert response.status_code == 400
        assert response.get_json()["status"] == "FAILURE"


def test_fine_tune_chat_rejects_cross_user_conversation():
    fake_chats = MagicMock()
    fake_chats.find_one.return_value = None
    fake_db = SimpleNamespace(chats=fake_chats)

    with app.test_client() as client, patch(
        "fine_tune.fine_tune_app.db",
        new=fake_db,
    ):
        response = client.post(
            "/api/fine-tune/chat",
            headers=_auth_header("u1"),
            json={"message": "Hello", "conversation_id": "owned-by-someone-else"},
        )

        assert response.status_code == 404
        assert response.get_json()["status"] == "FAILURE"
        fake_chats.find_one.assert_called_once_with(
            {"conversation_id": "owned-by-someone-else", "user_id": "u1"}
        )


def test_fine_tune_chat_success_contract():
    with app.test_client() as client, patch(
        "fine_tune.fine_tune_app.check_adapter_availability",
        return_value={
            "available": True,
            "model_id": "model-1",
            "output_dir": "/tmp/models/u/gpt2-lora",
            "completed_at": 1,
        },
    ), patch(
        "fine_tune.fine_tune_app.generate_lora_response",
        return_value=("hello there", {"model_id": "model-1"}),
    ):
        response = client.post(
            "/api/fine-tune/chat",
            headers=_auth_header(),
            json={"message": "Hello"},
        )
        assert response.status_code == 200
        payload = response.get_json()
        assert payload["answer"] == "hello there"
        assert payload["provider"] == "gpt2-lora"
        assert payload["model_id"] == "model-1"
        assert payload["status"] == "SUCCESS"


def test_fine_tune_chat_generation_failure_returns_safe_500():
    with app.test_client() as client, patch(
        "fine_tune.fine_tune_app.check_adapter_availability",
        return_value={
            "available": True,
            "model_id": "model-1",
            "output_dir": "/tmp/models/u/gpt2-lora",
            "completed_at": 1,
        },
    ), patch(
        "fine_tune.fine_tune_app.generate_lora_response",
        side_effect=RuntimeError("model load failed"),
    ):
        response = client.post(
            "/api/fine-tune/chat",
            headers=_auth_header(),
            json={"message": "Hello"},
        )

        assert response.status_code == 500
        payload = response.get_json()
        assert payload["status"] == "FAILURE"
        assert "GPT-2 LoRA" in payload["message"]


def test_fine_tune_chat_persists_messages_when_conversation_exists():
    fake_chats = MagicMock()
    fake_chats.find_one.return_value = {"conversation_id": "c1", "user_id": "u1", "messages": []}
    fake_chats.update_one.return_value = SimpleNamespace(modified_count=1)

    fake_db = SimpleNamespace(chats=fake_chats)

    with app.test_client() as client, patch(
        "fine_tune.fine_tune_app.check_adapter_availability",
        return_value={
            "available": True,
            "model_id": "model-1",
            "output_dir": "/tmp/models/u/gpt2-lora",
            "completed_at": 1,
        },
    ), patch(
        "fine_tune.fine_tune_app.generate_lora_response",
        return_value=("hello there", {"model_id": "model-1"}),
    ), patch(
        "fine_tune.fine_tune_app.db",
        new=fake_db,
    ):
        response = client.post(
            "/api/fine-tune/chat",
            headers=_auth_header("u1"),
            json={"message": "Hello", "conversation_id": "c1"},
        )
        assert response.status_code == 200
        fake_chats.find_one.assert_called_once()
        fake_chats.update_one.assert_called_once()


def test_start_fine_tune_returns_safe_failure_on_queue_error():
    with app.test_client() as client, patch(
        "fine_tune.fine_tune_app._extract_training_texts", return_value=["usable corpus"]
    ), patch(
        "fine_tune.fine_tune_app.fine_tune_gpt2_lora.delay",
        side_effect=RuntimeError("redis unavailable"),
    ):
        response = client.post("/api/fine-tune", headers=_auth_header())
        assert response.status_code == 500
        payload = response.get_json()
        assert payload["status"] == "FAILURE"
        assert payload["state"] == "FAILURE"
        assert "Failed to start" in payload["message"]


def test_status_success_serializes_objectid_in_result():
    success_with_objectid = SimpleNamespace(
        state="SUCCESS",
        info=None,
        result={"_id": ObjectId(), "output_dir": "./models/u/gpt2-lora", "trained_samples": 2},
    )

    with app.test_client() as client, patch(
        "fine_tune.fine_tune_app.celery_app.AsyncResult", return_value=success_with_objectid
    ):
        response = client.get("/api/fine-tune/status/task-oid", headers=_auth_header())
        assert response.status_code == 200
        payload = response.get_json()
        assert payload["status"] == "SUCCESS"
        assert isinstance(payload["result"].get("_id"), str)
        assert payload["result"]["_id"]


def test_lora_response_cleanup_stops_at_repeated_role_markers():
    decoded = (
        "User: Say hello\n"
        "Assistant: Hello!\n"
        "Assistant: Say hello\n"
        "Assistant: Hello again"
    )

    answer = _extract_assistant_answer(decoded, "User: Say hello\nAssistant:")

    assert answer == "Hello!"


def run_all_tests():
    tests = [
        ("start requires corpus", test_start_fine_tune_requires_corpus),
        ("start requires authentication", test_start_fine_tune_requires_authentication),
        ("start success contract", test_start_fine_tune_success_contract),
        ("status mapping contract", test_status_mapping_contract),
        ("status requires authentication", test_status_requires_authentication),
        ("model status requires authentication", test_model_status_requires_authentication),
        ("model status unavailable contract", test_model_status_unavailable_contract),
        ("fine-tune chat requires authentication", test_fine_tune_chat_requires_authentication),
        ("fine-tune chat unavailable", test_fine_tune_chat_unavailable_returns_404),
        ("fine-tune chat rejects empty message", test_fine_tune_chat_rejects_empty_message),
        ("fine-tune chat rejects cross-user conversation", test_fine_tune_chat_rejects_cross_user_conversation),
        ("fine-tune chat success contract", test_fine_tune_chat_success_contract),
        ("fine-tune chat generation failure", test_fine_tune_chat_generation_failure_returns_safe_500),
        ("fine-tune chat persists messages", test_fine_tune_chat_persists_messages_when_conversation_exists),
        ("start safe failure on queue error", test_start_fine_tune_returns_safe_failure_on_queue_error),
        ("status serializes ObjectId result", test_status_success_serializes_objectid_in_result),
        ("LoRA response cleanup", test_lora_response_cleanup_stops_at_repeated_role_markers),
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
