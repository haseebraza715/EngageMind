#!/usr/bin/env python3
"""Hard regression tests for thesis-critical RAG behaviors."""

import os
from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import patch

from flask import Flask

# Ensure imports work without production secrets.
os.environ.setdefault("MISTRAL_API_KEY", "test-mistral-key")
os.environ.setdefault("JWT_SECRET", "test-jwt-secret")
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017/test_db")

from rag.server.handlers.conversation_handler import (
    create_new_conversation,
    delete_conversation_by_id,
    get_conversation_by_id,
    list_user_conversations,
)
from rag.server.handlers.message_handler import handle_message, handle_no_documents
from rag.server.handlers.upload_handler import handle_document_upload
from rag.server.handlers import conversation_handler as conversation_handler_module
from rag.server.handlers import message_handler as message_handler_module
from rag.server.handlers import upload_handler as upload_handler_module


class FakeResult:
    def __init__(self, inserted_id=None, deleted_count=0):
        self.inserted_id = inserted_id
        self.deleted_count = deleted_count


class FakeCursor:
    def __init__(self, docs):
        self.docs = docs

    def sort(self, key, direction):
        reverse = direction == -1
        self.docs = sorted(self.docs, key=lambda d: d.get(key, 0), reverse=reverse)
        return self

    def limit(self, n):
        self.docs = self.docs[:n]
        return self

    def __iter__(self):
        return iter(self.docs)


class FakeChatsCollection:
    def __init__(self):
        self.data = []

    def _match(self, doc, query):
        return all(doc.get(k) == v for k, v in query.items())

    def _project(self, doc, projection):
        if not projection:
            return deepcopy(doc)
        include_keys = [k for k, v in projection.items() if v]
        if not include_keys:
            out = deepcopy(doc)
            for key, include in projection.items():
                if include == 0 and key in out:
                    del out[key]
            return out
        out = {}
        for key, include in projection.items():
            if key == "_id":
                continue
            if include and key in doc:
                out[key] = deepcopy(doc[key])
        return out

    def insert_one(self, doc):
        self.data.append(deepcopy(doc))
        return FakeResult(inserted_id=str(len(self.data)))

    def find_one(self, query, projection=None):
        for doc in self.data:
            if self._match(doc, query):
                return self._project(doc, projection)
        return None

    def find(self, query, projection=None):
        out = [self._project(d, projection) for d in self.data if self._match(d, query)]
        return FakeCursor(out)

    def delete_one(self, query):
        for i, doc in enumerate(self.data):
            if self._match(doc, query):
                self.data.pop(i)
                return FakeResult(deleted_count=1)
        return FakeResult(deleted_count=0)

    def update_one(self, query, update, upsert=False):
        target = None
        for doc in self.data:
            if self._match(doc, query):
                target = doc
                break

        if target is None:
            if not upsert:
                return
            target = {**query, "messages": []}
            self.data.append(target)

        if "$push" in update:
            for field, value in update["$push"].items():
                if field not in target:
                    target[field] = []
                if isinstance(value, dict) and "$each" in value:
                    target[field].extend(deepcopy(value["$each"]))
                else:
                    target[field].append(deepcopy(value))

        if "$set" in update:
            for key, value in update["$set"].items():
                target[key] = deepcopy(value)


class FakeDocumentsCollection:
    def __init__(self):
        self.data = []

    def insert_one(self, doc):
        self.data.append(deepcopy(doc))
        return FakeResult(inserted_id=str(len(self.data)))


class FakeDB:
    def __init__(self):
        self.chats = FakeChatsCollection()
        self.documents = FakeDocumentsCollection()


class DummyFile:
    def __init__(self, filename, content):
        self.filename = filename
        self._content = content

    def read(self):
        return self._content


app = Flask(__name__)


def test_no_doc_handler_appends_assistant_only():
    db = FakeDB()
    db.chats.insert_one(
        {
            "conversation_id": "c1",
            "user_id": "u1",
            "title": "T",
            "messages": [{"sender": "user", "text": "q", "timestamp": 1}],
            "created_at": 1,
            "updated_at": 1,
        }
    )

    answer = handle_no_documents("u1", "What is in my file?", "c1", db)
    assert isinstance(answer, str) and answer.strip()

    convo = db.chats.find_one({"conversation_id": "c1", "user_id": "u1"})
    assert len(convo["messages"]) == 2
    assert convo["messages"][-1]["sender"] == "assistant"
    assert isinstance(convo["updated_at"], int)


def test_handle_message_no_docs_no_duplicate_user_message():
    db = FakeDB()
    db.chats.insert_one(
        {
            "conversation_id": "c2",
            "user_id": "u2",
            "title": "T",
            "messages": [],
            "created_at": 1,
            "updated_at": 1,
        }
    )

    with app.app_context():
        resp, status = handle_message(
            user_id="u2",
            conversation_id="c2",
            user_msg="summarize",
            db=db,
            api_key="test",
            conversation_graph=SimpleNamespace(invoke=lambda s: s),
            user_has_documents_callback=lambda _u: False,
            load_state_callback=lambda _tid: None,
            save_state_callback=lambda _tid, _state: True,
        )

    payload = resp.get_json()
    assert status == 200
    assert "answer" in payload

    convo = db.chats.find_one({"conversation_id": "c2", "user_id": "u2"})
    assert len(convo["messages"]) == 2
    assert convo["messages"][0]["sender"] == "user"
    assert convo["messages"][1]["sender"] == "assistant"


def test_handle_message_validation_paths():
    db = FakeDB()

    with app.app_context():
        resp, status = handle_message(
            user_id="u",
            conversation_id="missing",
            user_msg="",
            db=db,
            api_key="test",
            conversation_graph=SimpleNamespace(invoke=lambda s: s),
            user_has_documents_callback=lambda _u: False,
            load_state_callback=lambda _tid: None,
            save_state_callback=lambda _tid, _state: True,
        )
        assert status == 400
        assert resp.get_json()["error"] == "No message provided"

        resp, status = handle_message(
            user_id="u",
            conversation_id="missing",
            user_msg="hi",
            db=db,
            api_key="test",
            conversation_graph=SimpleNamespace(invoke=lambda s: s),
            user_has_documents_callback=lambda _u: False,
            load_state_callback=lambda _tid: None,
            save_state_callback=lambda _tid, _state: True,
        )
        assert status == 404
        assert resp.get_json()["error"] == "Conversation not found"


def test_chitchat_route_bypasses_rag_pipeline():
    db = FakeDB()
    db.chats.insert_one(
        {
            "conversation_id": "c3",
            "user_id": "u3",
            "title": "T",
            "messages": [],
            "created_at": 1,
            "updated_at": 1,
        }
    )

    with patch.object(message_handler_module, "route_user_query", return_value=("chitchat", "Hello!")):
        with app.app_context():
            resp, status = handle_message(
                user_id="u3",
                conversation_id="c3",
                user_msg="hello",
                db=db,
                api_key="test",
                conversation_graph=SimpleNamespace(invoke=lambda _s: (_ for _ in ()).throw(RuntimeError("should not invoke"))),
                user_has_documents_callback=lambda _u: True,
                load_state_callback=lambda _tid: None,
                save_state_callback=lambda _tid, _state: True,
            )

    assert status == 200
    assert resp.get_json()["answer"] == "Hello!"
    convo = db.chats.find_one({"conversation_id": "c3", "user_id": "u3"})
    assert len(convo["messages"]) == 2


def test_conversation_crud_contract():
    db = FakeDB()

    with app.app_context(), patch.object(
        conversation_handler_module, "generate_conversation_id", return_value="conv-a"
    ):
        resp, status = create_new_conversation("u4", db, api_key="test")
        assert status == 201
        payload = resp.get_json()
        assert payload["conversation_id"] == "conv-a"

        resp, status = list_user_conversations("u4", db, api_key="test")
        assert status == 200
        assert len(resp.get_json()) == 1

        resp, status = get_conversation_by_id("u4", "conv-a", db, api_key="test")
        assert status == 200

        deleted = []
        resp, status = delete_conversation_by_id("u4", "conv-a", db, delete_thread_callback=lambda tid: deleted.append(tid))
        assert status == 200
        assert deleted == ["u4:conv-a"]


def test_upload_handler_success_txt_contract():
    db = FakeDB()
    file_obj = DummyFile("notes.txt", b"hello thesis")

    with app.app_context(), patch.object(
        upload_handler_module, "optimized_add_document_to_index", return_value=True
    ):
        resp, status = handle_document_upload(
            user_id="u5",
            file=file_obj,
            db=db,
            api_key="test",
            invalidate_cache_callback=lambda _u: None,
        )

    assert status == 200
    payload = resp.get_json()
    assert payload["status"] == "success"
    assert payload["document_id"]


def run_all_tests():
    tests = [
        ("No-doc handler stores assistant once", test_no_doc_handler_appends_assistant_only),
        ("No-doc message flow avoids duplicate user message", test_handle_message_no_docs_no_duplicate_user_message),
        ("Message validation paths", test_handle_message_validation_paths),
        ("Chitchat route bypasses RAG", test_chitchat_route_bypasses_rag_pipeline),
        ("Conversation CRUD contract", test_conversation_crud_contract),
        ("Upload handler txt success contract", test_upload_handler_success_txt_contract),
    ]

    passed = 0
    failed = []

    for name, fn in tests:
        try:
            fn()
            print(f"✅ {name}")
            passed += 1
        except Exception as exc:
            failed.append((name, str(exc)))
            print(f"❌ {name}: {exc}")

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
