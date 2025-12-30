"""
Intent detection and routing for chitchat vs document queries.
"""

import logging
from typing import Dict, List, Tuple

from rag.evaluation.evaluator import detect_intent

logger = logging.getLogger(__name__)


def route_user_query(user_msg: str, conversation_history: List[Dict]) -> Tuple[str, str]:
    """
    Route user query to appropriate handler (chitchat or RAG).

    Args:
        user_msg: User message
        conversation_history: Previous messages in conversation

    Returns:
        Tuple of (intent, chitchat_response)
        - intent: "chitchat" or "document_query"
        - chitchat_response: Response if chitchat, empty string otherwise
    """
    intent, chitchat_response = detect_intent(user_msg, conversation_history)

    if intent == "chitchat":
        logger.info(f"[INTENT] Chitchat detected: '{user_msg}'")
    else:
        logger.info(f"[INTENT] Document query detected: '{user_msg[:50]}...'")

    return intent, chitchat_response
