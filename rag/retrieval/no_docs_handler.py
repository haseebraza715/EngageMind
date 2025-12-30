"""
Handler for no-document scenarios.
Generates context-aware, varied responses when user has no uploaded documents.
Uses template-based approach for reliability and speed.
"""

import random
from typing import List, Dict


def generate_no_doc_response(query: str, history: List[Dict]) -> str:
    """
    Generate context-aware response for no-document scenario.

    Uses intelligent pattern matching + templates for fast, reliable responses.

    Args:
        query: User's current question
        history: Last few messages from conversation

    Returns:
        Contextual response suggesting document upload
    """
    query_lower = query.lower().strip()

    # Check if user is repeating/frustrated
    is_repeated = False
    if len(history) >= 2:
        # Check if last assistant message mentioned uploading
        last_assistant = next((m for m in reversed(history) if m.get("sender") == "assistant"), None)
        if last_assistant and any(word in last_assistant.get("text", "").lower()
                                  for word in ["upload", "document", "file"]):
            is_repeated = True

    # Pattern 1: Greetings
    if any(word in query_lower for word in ["hi", "hello", "hey", "sup", "yo", "greetings"]) and len(query_lower) < 20:
        return random.choice([
            "Hi! I'm your document assistant. Upload any files you'd like to discuss, and I can help you understand, analyze, or find information in them.",
            "Hello! Ready to help you with your documents. Upload a file and ask me anything about it!",
            "Hey there! I can help you work with documents - PDFs, text files, and more. What would you like to analyze today?"
        ])

    # Pattern 2: Asking about capabilities
    if any(phrase in query_lower for phrase in ["what can you", "what do you do", "how do you work", "what are you", "can you help", "help me"]):
        return random.choice([
            "I can analyze your documents and answer questions about them! Upload PDFs, text files, or other docs, and I'll help you find information, summarize content, or extract insights. What do you need help with?",
            "I'm here to help you understand your documents better. Upload any files, and I can answer questions, find specific info, compare content, or give you summaries. Ready to get started?",
            "Think of me as your document analyst! I read your uploaded files and help you find answers, spot patterns, or understand complex content. Upload something and try asking me about it!"
        ])

    # Pattern 3: Asking about current documents/data
    if any(phrase in query_lower for phrase in ["do you have", "what documents", "what files", "what data", "what info", "any documents", "show me", "list"]):
        if is_repeated:
            return "I still don't have any documents from you. Click the upload button to share a file, then I can help answer your questions about it!"
        return random.choice([
            "I don't have any documents from you yet. Upload a file and I'll be ready to answer questions about it right away!",
            "No documents uploaded yet. Share a file with me, and I can start helping you analyze and understand it.",
            "My document library for you is empty at the moment. Upload something and let's explore it together!"
        ])

    # Pattern 4: Questions that clearly need documents
    doc_keywords = ["analyze", "summarize", "find", "search", "extract", "compare", "show me", "tell me about", "explain"]
    if any(keyword in query_lower for keyword in doc_keywords):
        # Try to infer what type of document they need
        doc_type = "relevant documents"
        if any(word in query_lower for word in ["data", "numbers", "statistics", "metrics"]):
            doc_type = "data files or reports"
        elif any(word in query_lower for word in ["contract", "agreement", "legal"]):
            doc_type = "contracts or legal documents"
        elif any(word in query_lower for word in ["research", "paper", "study", "article"]):
            doc_type = "research papers or articles"
        elif any(word in query_lower for word in ["manual", "guide", "instructions", "how to"]):
            doc_type = "manuals or guides"

        return f"I'd love to help with that! To answer your question, please upload {doc_type} and I'll analyze them for you."

    # Pattern 5: Follow-up or vague queries
    if len(query_lower) < 15 or query_lower in ["ok", "okay", "sure", "yes", "no", "continue", "go on", "more", "next"]:
        return "Ready when you are! Upload a document to get started, and I'll help you explore it."

    # Pattern 6: General knowledge questions (answer them!)
    general_questions = {
        "what time": "I can't tell time, but I can help you analyze time-related data in your documents!",
        "what day": "I don't track dates, but I'm ready to help with your documents whenever you upload them.",
        "who are you": "I'm an AI document assistant. I help you understand and analyze files you upload. Try me with a PDF or text file!",
        "thank": "You're welcome! Let me know if you'd like to upload any documents to work with.",
    }

    for pattern, response in general_questions.items():
        if pattern in query_lower:
            return response

    # Default: Contextual based on query content
    if is_repeated:
        return random.choice([
            "I understand you're looking for information, but I need you to upload documents first. Once you do, I can give you detailed answers!",
            "Still waiting on those documents! Upload a file using the upload button, and I'll be able to help you right away.",
            "I really want to help, but I can't without documents to analyze. Upload something and ask again!"
        ])

    return random.choice([
        f'Interesting question! To give you a proper answer, I\'ll need you to upload relevant documents first. What files can you share?',
        f'I\'d need to see some documents to help with that. Upload the files you want me to analyze, and I\'ll get you an answer!',
        f'Good question! Upload the documents related to your query, and I\'ll help you find the answer in them.',
        f'To answer that, I\'ll need access to your documents. Upload them and let\'s explore together!'
    ])
