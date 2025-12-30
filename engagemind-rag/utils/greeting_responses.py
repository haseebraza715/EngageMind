"""
Greeting Response Generator

Provides context-aware, professional greeting responses that adapt to the conversation.
Better alternatives to generic "Hey! 😊" messages.
"""

import random
from typing import Optional
from datetime import datetime


# Professional greeting responses - context-aware and helpful
GREETING_RESPONSES = {
    "professional": [
        "Hello! I'm here to help you explore your documents. What would you like to know?",
        "Hi there! Ready to dive into your documents? Ask me anything.",
        "Welcome! I can help you find information in your uploaded documents. What are you looking for?",
        "Hello! I'm your document assistant. Feel free to ask questions about your documents.",
        "Hi! I'm ready to help you navigate through your documents. What can I assist you with?",
    ],
    "friendly": [
        "Hello! I'm here to help you explore your documents. What would you like to know?",
        "Hi there! Ready to dive into your documents? Ask me anything.",
        "Welcome! I can help you find information in your uploaded documents. What are you looking for?",
        "Hey! I'm your document assistant. Feel free to ask questions about your documents.",
        "Hi! I'm ready to help you navigate through your documents. What can I assist you with?",
    ],
    "contextual": [
        "Hello! I'm here to help you explore your documents. What would you like to know?",
        "Hi there! Ready to dive into your documents? Ask me anything.",
        "Welcome! I can help you find information in your uploaded documents. What are you looking for?",
        "Hello! I'm your document assistant. Feel free to ask questions about your documents.",
        "Hi! I'm ready to help you navigate through your documents. What can I assist you with?",
    ]
}

# Time-based greetings
def get_time_based_greeting() -> str:
    """Get a greeting based on time of day."""
    hour = datetime.now().hour
    if 5 <= hour < 12:
        return "Good morning"
    elif 12 <= hour < 17:
        return "Good afternoon"
    elif 17 <= hour < 21:
        return "Good evening"
    else:
        return "Hello"

# Context-aware greeting generator
def generate_greeting_response(
    style: str = "professional",
    has_documents: bool = True,
    user_name: Optional[str] = None
) -> str:
    """
    Generate a context-aware greeting response.
    
    Args:
        style: "professional", "friendly", or "contextual"
        has_documents: Whether user has uploaded documents
        user_name: Optional user name for personalization
        
    Returns:
        A personalized greeting message
    """
    time_greeting = get_time_based_greeting()
    
    # Select response pool based on style
    responses = GREETING_RESPONSES.get(style, GREETING_RESPONSES["professional"])
    
    # Base response
    base_response = random.choice(responses)
    
    # Personalize if name provided
    if user_name:
        base_response = base_response.replace("Hello", f"{time_greeting}, {user_name}")
        base_response = base_response.replace("Hi", f"{time_greeting}, {user_name}")
        base_response = base_response.replace("Hey", f"{time_greeting}, {user_name}")
    else:
        base_response = base_response.replace("Hello", time_greeting)
        base_response = base_response.replace("Hi", time_greeting)
        base_response = base_response.replace("Hey", time_greeting)
    
    # Adjust based on document availability
    if not has_documents:
        base_response = base_response.replace(
            "your documents",
            "documents you upload"
        )
        base_response = base_response.replace(
            "your uploaded documents",
            "documents you upload"
        )
    
    return base_response


# Alternative: Simple, clean greeting without emojis
SIMPLE_GREETINGS = [
    "Hello! How can I help you today?",
    "Hi! What would you like to know?",
    "Welcome! I'm here to assist you.",
    "Hello! Ready to explore your documents?",
    "Hi there! What can I help you with?",
]

def get_simple_greeting() -> str:
    """Get a simple, clean greeting without emojis."""
    return random.choice(SIMPLE_GREETINGS)

