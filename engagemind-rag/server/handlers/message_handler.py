"""
Message handling and RAG pipeline orchestration.
"""

import logging
import os
import time
from typing import Any, Dict, Tuple

from flask import jsonify
from langchain_mistralai.chat_models import ChatMistralAI

from rag.retrieval.no_docs_handler import generate_no_doc_response
from rag.utils.conversation_manager import generate_conversation_title_from_context
from rag.server.workflows.intent_router import route_user_query

logger = logging.getLogger(__name__)


def handle_no_documents(user_id: str, query: str, conversation_id: str, db) -> str:
    """
    Handle user queries when no documents are uploaded.

    Args:
        user_id: User identifier
        query: User's question
        conversation_id: Current conversation ID
        db: MongoDB database instance

    Returns:
        Contextual response suggesting document upload
    """
    try:
        # Load conversation history (last 3 messages for context)
        convo = db.chats.find_one(
            {"conversation_id": conversation_id, "user_id": user_id}
        )
        history = convo.get("messages", [])[-3:] if convo else []

        # Generate contextual response using LLM
        response = generate_no_doc_response(query, history)

        # Save assistant message to MongoDB. User message was already stored by `handle_message`.
        timestamp = int(time.time())
        db.chats.update_one(
            {"conversation_id": conversation_id, "user_id": user_id},
            {
                "$push": {"messages": {"sender": "assistant", "text": response, "timestamp": timestamp}},
                "$set": {"updated_at": timestamp + 1},
            },
            upsert=False,
        )

        logger.info(f"[NO DOCS] Handled query for user {user_id} without documents")
        return response

    except Exception as e:
        logger.exception(f"[NO DOCS] Unexpected error in no-document handler: {e}")
        return "I'm ready to help! Upload a document and I can answer questions, analyze content, or find information for you."


def should_update_title(convo: Dict, msg_count: int) -> bool:
    """
    Determine if conversation title should be updated.

    Args:
        convo: Conversation document from MongoDB
        msg_count: Total message count

    Returns:
        True if title should be updated
    """
    # Exponential update intervals: 1, 5, 10, 20, 40, 80, ...
    is_update_interval = (
        msg_count == 1 or  # First message
        msg_count == 5 or  # 5 messages (early conversation)
        (msg_count >= 10 and msg_count in [10, 20, 40, 80, 160])  # Exponential after 10
    )

    return (
        "title" not in convo or
        not convo.get("title") or
        len(convo.get("title", "")) > 20 or
        "-" in convo.get("title", "") or
        is_update_interval
    )


def handle_message(
    user_id: str,
    conversation_id: str,
    user_msg: str,
    db,
    api_key: str,
    conversation_graph,
    user_has_documents_callback,
    load_state_callback,
    save_state_callback
) -> Tuple[Any, int]:
    """
    Handle incoming user message and generate response.

    Args:
        user_id: User identifier
        conversation_id: Conversation identifier
        user_msg: User message text
        db: MongoDB database instance
        api_key: Mistral API key
        conversation_graph: LangGraph conversation workflow
        user_has_documents_callback: Callback to check if user has documents
        load_state_callback: Callback to load conversation state
        save_state_callback: Callback to save conversation state

    Returns:
        Tuple of (response, status_code)
    """
    if not user_msg:
        return jsonify({"error": "No message provided"}), 400

    try:
        timestamp = int(time.time())
        filter_q = {"conversation_id": conversation_id, "user_id": user_id}

        # Verify conversation exists
        convo = db.chats.find_one(filter_q)
        if not convo:
            return jsonify({"error": "Conversation not found"}), 404

        # Save user message
        db.chats.update_one(
            filter_q,
            {
                "$push": {"messages": {"sender": "user", "text": user_msg, "timestamp": timestamp}},
                "$set": {"updated_at": timestamp}
            }
        )

        # ============================================================
        # INTENT DETECTION - Skip RAG for chitchat/greetings
        # ============================================================
        intent, chitchat_response = route_user_query(user_msg, convo.get("messages", []))

        if intent == "chitchat":
            # Fast path - no RAG needed for greetings/chitchat
            assistant_message = chitchat_response

            # Save response to MongoDB
            ts2 = int(time.time())
            db.chats.update_one(
                filter_q,
                {
                    "$push": {"messages": {"sender": "assistant", "text": assistant_message, "timestamp": ts2}},
                    "$set": {"updated_at": ts2}
                }
            )

            return jsonify({"answer": assistant_message}), 200

        # ============================================================
        # DOCUMENT QUERY - Full RAG pipeline
        # ============================================================
        logger.info(f"[DOCUMENT_QUERY] Processing: '{user_msg[:50]}...'")

        # ============================================================
        # EARLY DETECTION - Fast path for no documents (with caching)
        # ============================================================
        if not user_has_documents_callback(user_id):
            logger.info(f"[NO DOCS] No FAISS index for user {user_id}")
            response = handle_no_documents(user_id, user_msg, conversation_id, db)
            return jsonify({"answer": response}), 200

        # ============================================================
        # Load or initialize state
        # ============================================================
        thread_id = f"{user_id}:{conversation_id}"
        state = load_state_callback(thread_id)

        if not state:
            # Initialize new state
            state = {
                "user_id": user_id,
                "messages": convo.get("messages", []),
                "context": {},
                "current_message": user_msg,
                "rewritten_query": "",
                "metrics": {}
            }
            logger.info(f"[STATE] Initialized state for {thread_id}")
        else:
            # Update existing state
            mongo_messages = convo.get("messages", [])
            state["messages"] = mongo_messages
            state["current_message"] = user_msg
            state["rewritten_query"] = ""
            state["metrics"] = {}
            logger.info(f"[STATE] Loaded state for {thread_id}")

        # Run conversation graph
        updated_state = conversation_graph.invoke(state)

        # Save state
        save_state_callback(thread_id, updated_state)

        # Get response
        if updated_state["messages"] and updated_state["messages"][-1]["sender"] == "assistant":
            assistant_message = updated_state["messages"][-1]["text"]
        else:
            assistant_message = "I encountered an issue processing your request."

        # Update MongoDB
        ts2 = int(time.time())

        # Prepare update data
        update_data = {
            "$push": {"messages": {"sender": "assistant", "text": assistant_message, "timestamp": ts2}},
            "$set": {"updated_at": ts2}
        }

        # Get all messages including the new one
        all_messages = convo.get("messages", []) + [
            {"sender": "user", "text": user_msg, "timestamp": timestamp},
            {"sender": "assistant", "text": assistant_message, "timestamp": ts2}
        ]

        # Update title if needed
        msg_count = len(all_messages)
        if should_update_title(convo, msg_count):
            new_title = generate_conversation_title_from_context(
                all_messages,
                llm=ChatMistralAI(mistral_api_key=api_key)
            )
            update_data["$set"]["title"] = new_title
            logger.info(f"[TITLE] Updated for {conversation_id}: {new_title}")

        db.chats.update_one(filter_q, update_data)

        return jsonify({"answer": assistant_message}), 200

    except Exception as e:
        logger.exception(f"Error in conversation: {e}")
        error_msg = "I encountered an error. Please try again."

        ts_error = int(time.time())
        db.chats.update_one(
            filter_q,
            {
                "$push": {"messages": {"sender": "assistant", "text": error_msg, "timestamp": ts_error}},
                "$set": {"updated_at": ts_error}
            }
        )

        return jsonify({"error": str(e), "answer": error_msg}), 500
