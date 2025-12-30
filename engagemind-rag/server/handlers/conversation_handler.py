"""
Conversation CRUD handler.
"""

import logging
import time
from typing import Any, Tuple

from flask import jsonify
from langchain_mistralai.chat_models import ChatMistralAI

from rag.utils.conversation_manager import (
    generate_conversation_id,
    generate_conversation_title,
    generate_conversation_title_from_context
)

logger = logging.getLogger(__name__)


def create_new_conversation(user_id: str, db, api_key: str, custom_name: str = "", initial_message: str = "") -> Tuple[Any, int]:
    """
    Create a new conversation.

    Args:
        user_id: User identifier
        db: MongoDB database instance
        api_key: Mistral API key
        custom_name: Optional custom conversation name
        initial_message: Optional first message to generate title from

    Returns:
        Tuple of (response, status_code)
    """
    timestamp = int(time.time())

    # Generate meaningful title from first message or use custom name
    if custom_name:
        title = custom_name
    elif initial_message:
        # Generate title from first message using LLM
        title = generate_conversation_title(initial_message, llm=ChatMistralAI(mistral_api_key=api_key))
    else:
        # Default title
        title = "New Conversation"

    # Generate conversation ID (modern AI style - short, clean, non-descriptive)
    existing_ids = [c.get("conversation_id") for c in db.chats.find(
        {"user_id": user_id},
        {"conversation_id": 1}
    )]
    convo_id = generate_conversation_id(existing_ids=existing_ids)

    new_chat = {
        "conversation_id": convo_id,
        "user_id": user_id,
        "title": title,
        "messages": [],
        "created_at": timestamp,
        "updated_at": timestamp,
    }
    db.chats.insert_one(new_chat)
    logger.info(f"[CREATE] User {user_id} created convo {convo_id} with title: {title}")

    return jsonify({"conversation_id": convo_id, "title": title}), 201


def get_conversation_by_id(user_id: str, conversation_id: str, db, api_key: str) -> Tuple[Any, int]:
    """
    Get a conversation by ID.

    Args:
        user_id: User identifier
        conversation_id: Conversation identifier
        db: MongoDB database instance
        api_key: Mistral API key

    Returns:
        Tuple of (response, status_code)
    """
    convo = db.chats.find_one(
        {"conversation_id": conversation_id, "user_id": user_id},
        {"_id": 0}
    )
    if not convo:
        return jsonify({"error": "Not found"}), 404

    # Ensure title exists and is context-based (for old conversations)
    if "title" not in convo or not convo.get("title") or "-" in convo.get("title", ""):
        # Generate title from conversation context (all messages)
        messages = convo.get("messages", [])
        if messages:
            convo["title"] = generate_conversation_title_from_context(
                messages,
                llm=ChatMistralAI(mistral_api_key=api_key)
            )
            # Update in database for next time
            db.chats.update_one(
                {"conversation_id": conversation_id, "user_id": user_id},
                {"$set": {"title": convo["title"]}}
            )
        else:
            convo["title"] = convo.get("conversation_id", "Untitled Conversation")

    return jsonify(convo), 200


def list_user_conversations(user_id: str, db, api_key: str) -> Tuple[Any, int]:
    """
    List all conversations for a user.

    Args:
        user_id: User identifier
        db: MongoDB database instance
        api_key: Mistral API key

    Returns:
        Tuple of (response, status_code)
    """
    docs = list(db.chats.find(
        {"user_id": user_id},
        {"_id": 0, "conversation_id": 1, "title": 1, "messages": 1, "created_at": 1, "updated_at": 1}
    ).sort("updated_at", -1).limit(50))

    # Ensure all conversations have context-based titles (for backward compatibility)
    for convo in docs:
        if "title" not in convo or not convo.get("title") or "-" in convo.get("title", ""):
            # Generate title from conversation context (all messages)
            messages = convo.get("messages", [])
            if messages:
                convo["title"] = generate_conversation_title_from_context(
                    messages,
                    llm=ChatMistralAI(mistral_api_key=api_key)
                )
            else:
                convo["title"] = convo.get("conversation_id", "Untitled")

    return jsonify(docs), 200


def delete_conversation_by_id(user_id: str, conversation_id: str, db, delete_thread_callback) -> Tuple[Any, int]:
    """
    Delete a conversation.

    Args:
        user_id: User identifier
        conversation_id: Conversation identifier
        db: MongoDB database instance
        delete_thread_callback: Callback to delete conversation thread state

    Returns:
        Tuple of (response, status_code)
    """
    res = db.chats.delete_one({"conversation_id": conversation_id, "user_id": user_id})
    if res.deleted_count == 0:
        return jsonify({"error": "Not found"}), 404

    # Also delete state
    delete_thread_callback(f"{user_id}:{conversation_id}")

    logger.info(f"[DELETE] {user_id} deleted {conversation_id}")
    return jsonify({"status": "Deleted"}), 200
