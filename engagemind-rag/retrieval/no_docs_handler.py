"""
Handler for no-document scenarios.
Generates concise, consistent responses when no user documents are available.
"""

import random
from typing import List, Dict


def generate_no_doc_response(query: str, history: List[Dict]) -> str:
    """
    Generate concise response for no-document scenario.

    Args:
        query: User's current question
        history: Last few messages from conversation

    Returns:
        Contextual response guiding user to upload documents
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
            "Hi. Upload a document and I can answer questions from it.",
            "Hello. Share a file and I will analyze it with you.",
            "Hey. Once you upload a document, I can help with summaries and answers."
        ])

    # Pattern 2: Asking about capabilities
    if any(phrase in query_lower for phrase in ["what can you", "what do you do", "how do you work", "what are you", "can you help", "help me"]):
        return random.choice([
            "I answer questions using your uploaded documents. Upload a file to begin.",
            "I can summarize, compare, and extract facts from your documents after upload.",
            "I work as a document assistant. Share a file and ask your question."
        ])

    # Pattern 3: Asking about current documents/data
    if any(phrase in query_lower for phrase in ["do you have", "what documents", "what files", "what data", "what info", "any documents", "show me", "list"]):
        if is_repeated:
            return "I still do not have documents for this account. Upload one file and ask again."
        return random.choice([
            "No documents are uploaded yet. Upload one document and I can answer from it.",
            "I do not see uploaded documents yet. Upload one document to continue.",
            "Your document set is empty. Share one document and I will start analysis."
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

        return f"To answer that, upload {doc_type}. I will then respond using only that content."

    # Pattern 5: Follow-up or vague queries
    if len(query_lower) < 15 or query_lower in ["ok", "okay", "sure", "yes", "no", "continue", "go on", "more", "next"]:
        return "Ready when you are. Upload a document to get started."

    # Pattern 6: General knowledge questions (answer them!)
    general_questions = {
        "what time": "I cannot check time here, but I can analyze time-related details inside uploaded documents.",
        "what day": "I do not track dates directly. Upload documents and I can extract date information from them.",
        "who are you": "I am a document-grounded assistant. Upload a file and I will answer from it.",
        "thank": "You are welcome. Upload a document whenever you are ready.",
    }

    for pattern, response in general_questions.items():
        if pattern in query_lower:
            return response

    # Default: Contextual based on query content
    if is_repeated:
        return random.choice([
            "I still need uploaded documents before I can answer this accurately.",
            "Please upload at least one document first, then I can answer with evidence.",
            "I cannot answer from source material yet because no document is uploaded."
        ])

    return random.choice([
        "I need uploaded documents to answer this with evidence.",
        "Please upload relevant files first so I can answer from your material.",
        "I cannot verify this yet because no documents are available.",
        "Upload a document and I will provide a grounded answer."
    ])
