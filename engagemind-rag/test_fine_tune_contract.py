#!/usr/bin/env python3
"""Requirement-driven tests for fine-tune API contract semantics."""

import os
from types import SimpleNamespace
from unittest.mock import patch

import jwt

# Ensure required env vars exist before importing app modules.
os.environ.setdefault("MISTRAL_API_KEY", "test-mistral-key")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017/test_db")

from fine_tune.fine_tune_app import app


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


def run_all_tests():
    tests = [
        ("start requires corpus", test_start_fine_tune_requires_corpus),
        ("start success contract", test_start_fine_tune_success_contract),
        ("status mapping contract", test_status_mapping_contract),
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
