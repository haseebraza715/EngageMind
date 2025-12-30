"""
Conversation Management Utilities

Handles conversation ID generation, title generation, and conversation utilities.
Conversation IDs are now short, clean identifiers (like modern AI systems).
Titles are what users see - IDs are for backend tracking only.
"""

import logging
import re
import time
import secrets
import hashlib
from typing import List, Dict, Any, Optional
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

logger = logging.getLogger(__name__)


def generate_short_id(length: int = 12) -> str:
    """
    Generate a short, clean conversation ID (like modern AI systems).
    
    Modern AI systems use short, non-descriptive IDs:
    - ChatGPT: "chatcmpl-abc123xyz"
    - Claude: Short alphanumeric IDs
    - Clean, URL-safe, not descriptive
    
    Args:
        length: Length of the ID (default 12 for good uniqueness)
        
    Returns:
        A short, clean ID like "a1b2c3d4e5f6"
    """
    # Generate a secure random ID (alphanumeric, lowercase)
    # Using secrets for cryptographically strong randomness
    alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_conversation_title_from_context(
    messages: List[Dict[str, Any]], 
    llm, 
    max_length: int = 50
) -> str:
    """
    Generate a meaningful conversation title based on the full conversation context.
    This updates as the conversation evolves to reflect the main topic.
    
    Args:
        messages: List of conversation messages (with 'sender' and 'text' keys)
        llm: Language model instance
        max_length: Maximum title length
        
    Returns:
        A concise, meaningful title that reflects the conversation context
    """
    if not messages:
        return "New Conversation"
    
    # Extract user messages (last 5-10 messages for context)
    user_messages = [msg.get("text", "") for msg in messages if msg.get("sender") == "user"]
    if not user_messages:
        return "New Conversation"
    
    # For very short conversations, use first message
    if len(user_messages) == 1:
        first_msg = user_messages[0]
        if len(first_msg) <= max_length and not first_msg.endswith("?"):
            return first_msg.strip()[:max_length]
    
    # For longer conversations, analyze the context
    try:
        # Build conversation summary (last 10 messages for context - optimized)
        recent_messages = user_messages[-10:] if len(user_messages) > 10 else user_messages
        conversation_summary = "\n".join([f"User: {msg}" for msg in recent_messages])
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """Generate a concise, descriptive title for a conversation based on the conversation context.
Rules:
- Maximum 50 characters
- No question marks or punctuation at the end
- Capture the MAIN topic being discussed (not just the first message)
- Reflect what the conversation is actually about
- Be specific but concise
- Examples:
  Multiple questions about OSI model → "OSI Model Discussion"
  Questions about routing and protocols → "Routing Protocols"
  Network security questions → "Network Security"
  Mixed topics → "Technical Q&A" or "Document Discussion"
Output ONLY the title, nothing else."""),
            ("human", """Conversation context:
{conversation_summary}

Generate a title that reflects what this conversation is about:""")
        ])
        
        chain = prompt | llm | StrOutputParser()
        title = chain.invoke({"conversation_summary": conversation_summary}).strip()
        
        # Clean up title
        title = title.replace('"', '').replace("'", "").strip()
        if title.endswith(".") or title.endswith("?") or title.endswith(":"):
            title = title[:-1].strip()
        
        # Ensure max length
        if len(title) > max_length:
            title = title[:max_length-3] + "..."
        
        return title if title else "New Conversation"
        
    except Exception as e:
        logger.warning(f"[TITLE] Failed to generate title from context: {e}, using fallback")
        # Fallback: Use first few words of most recent message
        last_msg = user_messages[-1]
        words = last_msg.split()[:6]
        title = " ".join(words)
        if len(title) > max_length:
            title = title[:max_length-3] + "..."
        return title if title else "New Conversation"


def generate_conversation_title(message: str, llm, max_length: int = 50) -> str:
    """
    Generate a meaningful conversation title from a single message (for new conversations).
    
    Args:
        message: The first message in the conversation
        llm: Language model instance
        max_length: Maximum title length
        
    Returns:
        A concise, meaningful title
    """
    if not message or len(message.strip()) < 3:
        return "New Conversation"
    
    # For very short messages, use them directly (truncated)
    if len(message) <= max_length and not message.endswith("?"):
        return message.strip()[:max_length]
    
    # For longer messages or questions, generate a title using LLM
    try:
        from langchain_core.prompts import ChatPromptTemplate
        from langchain_core.output_parsers import StrOutputParser
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", """Generate a concise, descriptive title for a conversation based on the first message.
Rules:
- Maximum 50 characters
- No question marks or punctuation at the end
- Capture the main topic or intent
- Be specific but concise
- Examples:
  "What is the OSI model?" → "OSI Model Explanation"
  "Explain routing protocols" → "Routing Protocols"
  "Tell me about network security" → "Network Security"
Output ONLY the title, nothing else."""),
            ("human", "First message: {message}\n\nTitle:")
        ])
        
        chain = prompt | llm | StrOutputParser()
        title = chain.invoke({"message": message}).strip()
        
        # Clean up title
        title = title.replace('"', '').replace("'", "").strip()
        if title.endswith(".") or title.endswith("?"):
            title = title[:-1].strip()
        
        # Ensure max length
        if len(title) > max_length:
            title = title[:max_length-3] + "..."
        
        return title if title else "New Conversation"
        
    except Exception as e:
        logger.warning(f"[TITLE] Failed to generate title: {e}, using fallback")
        # Fallback: Use first few words
        words = message.split()[:6]
        title = " ".join(words)
        if len(title) > max_length:
            title = title[:max_length-3] + "..."
        return title if title else "New Conversation"


def generate_conversation_id(existing_ids: Optional[List[str]] = None) -> str:
    """
    Generate a unique conversation ID (modern AI style).
    
    Modern AI systems use:
    - Short, clean IDs (not descriptive)
    - Alphanumeric, URL-safe
    - Backend-only (users see titles, not IDs)
    - Examples: "a1b2c3d4e5f6", "conv_abc123"
    
    Args:
        existing_ids: Optional list of existing conversation IDs to avoid duplicates
        
    Returns:
        A unique conversation ID (short, clean, modern format)
    """
    if existing_ids is None:
        existing_ids = []
    
    # Generate short ID (12 chars is good balance of uniqueness and brevity)
    max_attempts = 10
    for _ in range(max_attempts):
        new_id = generate_short_id(length=12)
        if new_id not in existing_ids:
            return new_id
    
    # Fallback: add timestamp if collisions occur (very unlikely)
    timestamp = str(int(time.time()))[-6:]
    return f"{generate_short_id(length=6)}{timestamp}"

