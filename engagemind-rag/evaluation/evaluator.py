import logging
import hashlib
import re
import random
from typing import List, Optional, Dict, Any, Tuple
from functools import lru_cache
from cachetools import TTLCache
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

try:
    import Levenshtein
    HAS_LEVENSHTEIN = True
except ImportError:
    HAS_LEVENSHTEIN = False

logger = logging.getLogger(__name__)


# ============================================================================
# INTENT DETECTION - Determine if message needs RAG or is just chitchat
# ============================================================================

# Fuzzy matching helper for typo tolerance
def _fuzzy_match(text: str, patterns: List[str], max_distance: int = 2) -> bool:
    """Check if text fuzzy-matches any pattern (Levenshtein ≤ max_distance)."""
    if not HAS_LEVENSHTEIN:
        return False
    text = text.lower().strip()
    for pattern in patterns:
        if Levenshtein.distance(text, pattern.lower()) <= max_distance:
            return True
    return False

# Common greetings and chitchat patterns (no LLM needed)
CHITCHAT_PATTERNS = [
    r'^(hi|hello|hey|hola|howdy|greetings|yo|heya)[\s!.,?]*$',
    r'^(bye|goodbye|see you|later|cya)[\s!.,?]*$',
    r'^(thanks|thank you|thx|ty|thnx|thks|thnaks)[\s!.,?]*$',
    r'^(ok|okay|sure|alright|got it|understood|kk|k|okie|okok)[\s!.,?]*$',
    r'^(yes|no|yeah|nope|yep|nah)[\s!.,?]*$',
    r'^(good morning|good afternoon|good evening|good night)[\s!.,?]*$',
    r'^(how are you|how\'s it going|what\'s up|sup)[\s!.,?]*$',
    r'^(nice|great|awesome|cool|perfect|sweet)[\s!.,?]*$',
    r'^(no problem|np|no worries|nw|anytime|any time)[\s!.,?]*$',
    r'^(sure thing|you bet|of course|absolutely)[\s!.,?]*$',
    r'^(my pleasure|happy to help|glad to help)[\s!.,?]*$',
    r'^(you\'re welcome|yw|ur welcome|welcome)[\s!.,?]*$',
    r'^(cheers|all good|sounds good|works for me|cool beans)[\s!.,?]*$',
    r'^[\s]*$',  # Empty or whitespace only
]

# Compile patterns for efficiency
_chitchat_regex = [re.compile(p, re.IGNORECASE) for p in CHITCHAT_PATTERNS]

# Fuzzy match patterns for typo tolerance
_FUZZY_GREETINGS = ["hi", "hello", "hey", "hola"]
_FUZZY_THANKS = ["thanks", "thank you", "thx"]
_FUZZY_ACKNOWLEDGMENTS = ["no problem", "np", "no worries", "ok", "okay"]

# Import better greeting responses
try:
    from rag.utils.greeting_responses import generate_greeting_response, get_simple_greeting
    USE_IMPROVED_GREETINGS = True
except ImportError:
    USE_IMPROVED_GREETINGS = False

# Chitchat responses - improved, context-aware
def _get_greeting_response(has_documents: bool = True) -> str:
    """Get a context-aware greeting response."""
    if USE_IMPROVED_GREETINGS:
        return generate_greeting_response(
            style="professional",
            has_documents=has_documents
        )
    # Fallback to simple greeting
    return "Hello! I'm your document assistant. Feel free to ask me questions about the documents you've uploaded, or upload new ones for me to help you with."

# Note: "greeting" is now generated dynamically via _get_greeting_response()
CHITCHAT_RESPONSES = {
    "farewell": "Goodbye! Feel free to come back anytime you need help with your documents.",
    "thanks": "You're welcome! Let me know if you have any other questions about your documents.",
    "acknowledgment": "Got it! Is there anything specific you'd like to know about your documents?",
    "acknowledgment_positive": [
        "Come back anytime!",
        "Happy to help!",
        "Feel free to reach out again!",
        "Glad I could assist!",
        "Anytime you need help!"
    ],
    "how_are_you": "I'm doing well, thank you for asking! I'm here to help you explore and understand your documents. What would you like to know?",
    "default": "I'm here to help you with questions about your uploaded documents. What would you like to know?"
}


def detect_intent(message: str, conversation_history: Optional[List[Dict[str, Any]]] = None) -> Tuple[str, Optional[str]]:
    """
    Detect the intent of a user message with context awareness.

    Args:
        message: The user's message
        conversation_history: Optional list of previous messages [{"sender": "user"|"assistant", "text": "..."}]

    Returns:
        Tuple of (intent_type, response)
        - intent_type: "chitchat" or "document_query"
        - response: Pre-defined response for chitchat, None for document queries
    """
    message = message.strip().lower()

    # Check if it's empty
    if not message:
        return ("chitchat", CHITCHAT_RESPONSES["default"])

    # Context-aware: Check if this is acknowledgment after assistant response
    if conversation_history and len(conversation_history) >= 1:
        last_msg = conversation_history[-1]
        if last_msg.get("sender") == "assistant" and len(message.split()) <= 3:
            # User sent short message after assistant response - likely acknowledgment
            if not message.endswith('?') and not any(q in message for q in ["what", "how", "why", "when", "where", "who", "which"]):
                # Return random positive acknowledgment response
                responses = CHITCHAT_RESPONSES["acknowledgment_positive"]
                return ("chitchat", random.choice(responses))

    # Fuzzy matching for typos (if Levenshtein available)
    if HAS_LEVENSHTEIN:
        if _fuzzy_match(message, _FUZZY_GREETINGS):
            greeting = _get_greeting_response(has_documents=True)
            return ("chitchat", greeting)
        if _fuzzy_match(message, _FUZZY_THANKS):
            return ("chitchat", CHITCHAT_RESPONSES["thanks"])
        if _fuzzy_match(message, _FUZZY_ACKNOWLEDGMENTS):
            responses = CHITCHAT_RESPONSES["acknowledgment_positive"]
            return ("chitchat", random.choice(responses))

    # Check against chitchat patterns
    for pattern in _chitchat_regex:
        if pattern.match(message):
            # Determine which type of chitchat
            if any(g in message for g in ["hi", "hello", "hey", "hola", "howdy", "greetings", "good morning", "good afternoon", "good evening", "yo", "heya"]):
                # Use improved greeting response (generated dynamically)
                greeting = _get_greeting_response(has_documents=True)
                return ("chitchat", greeting)
            elif any(f in message for f in ["bye", "goodbye", "see you", "later", "cya", "good night"]):
                return ("chitchat", CHITCHAT_RESPONSES["farewell"])
            elif any(t in message for t in ["thanks", "thank", "thx", "ty", "thnx", "thks", "thnaks"]):
                return ("chitchat", CHITCHAT_RESPONSES["thanks"])
            elif any(a in message for a in ["no problem", "np", "no worries", "nw", "anytime", "any time", "sure thing", "you bet", "of course", "absolutely", "my pleasure", "happy to help", "glad to help", "you're welcome", "yw", "ur welcome", "welcome", "cheers", "all good", "sounds good", "works for me", "cool beans"]):
                # Return random positive acknowledgment response
                responses = CHITCHAT_RESPONSES["acknowledgment_positive"]
                return ("chitchat", random.choice(responses))
            elif any(a in message for a in ["ok", "okay", "sure", "alright", "got it", "understood", "yes", "no", "yeah", "nope", "kk", "k", "okie", "okok"]):
                return ("chitchat", CHITCHAT_RESPONSES["acknowledgment"])
            elif any(h in message for h in ["how are you", "how's it going", "what's up", "sup"]):
                return ("chitchat", CHITCHAT_RESPONSES["how_are_you"])
            else:
                return ("chitchat", CHITCHAT_RESPONSES["default"])

    # If message is very short (< 3 words) and doesn't look like a question
    words = message.split()
    if len(words) < 3 and not message.endswith('?') and not any(q in message for q in ["what", "how", "why", "when", "where", "who", "which", "explain", "describe", "tell"]):
        return ("chitchat", CHITCHAT_RESPONSES["default"])

    # It's a document query
    return ("document_query", None)


def is_chitchat(message: str) -> bool:
    """
    Quick check if a message is chitchat.

    Args:
        message: The user's message

    Returns:
        True if chitchat, False if document query
    """
    intent, _ = detect_intent(message)
    return intent == "chitchat"


def get_chitchat_response(message: str) -> Optional[str]:
    """
    Get a chitchat response if the message is chitchat.

    Args:
        message: The user's message

    Returns:
        Response string if chitchat, None if document query
    """
    intent, response = detect_intent(message)
    return response if intent == "chitchat" else None

# ============================================================================
# QUERY REWRITING WITH CACHING
# ============================================================================

# Cache rewritten queries for 10 minutes (600 seconds)
# This prevents duplicate LLM calls for the same question
_query_rewrite_cache: TTLCache = TTLCache(maxsize=500, ttl=600)

REWRITE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a search query optimizer. Your task is to rewrite user questions to improve document retrieval.

RULES:
1. Make the question more specific and search-friendly
2. Expand abbreviations and acronyms
3. Include relevant synonyms or related terms
4. Remove filler words and conversational elements
5. Keep the core intent intact
6. Output ONLY the rewritten query, nothing else

Example:
Original: "how do I do that thing with the API?"
Rewritten: "API integration implementation guide usage examples"""),
    ("human", "Original question: {question}\n\nRewritten query:")
])

def _get_query_hash(question: str) -> str:
    """Generate a hash for caching queries."""
    return hashlib.md5(question.lower().strip().encode()).hexdigest()

def rewrite_query(question: str, llm, use_cache: bool = True) -> str:
    """
    Rewrite a vague or unclear question to improve retrieval quality.
    Uses caching to prevent duplicate LLM calls for the same question.

    Args:
        question: The user's original question.
        llm: The LLM instance used for rewriting.
        use_cache: Whether to use cached results (default True).

    Returns:
        A cleaner, reformulated question.
    """
    question = question.strip()

    # Skip rewriting for very short or already clear questions
    if len(question) < 10 or question.count(' ') < 2:
        logger.debug(f"[REWRITE] Skipping rewrite for short query: {question}")
        return question

    # Check cache first
    query_hash = _get_query_hash(question)
    if use_cache and query_hash in _query_rewrite_cache:
        cached = _query_rewrite_cache[query_hash]
        logger.debug(f"[REWRITE] Cache hit for: {question[:50]}...")
        return cached

    try:
        chain = REWRITE_PROMPT | llm | StrOutputParser()
        improved = chain.invoke({"question": question}).strip()

        # Validate the rewrite isn't empty or too different
        if not improved or len(improved) < 5:
            logger.warning(f"[REWRITE] Empty or too short rewrite, using original")
            improved = question

        # Cache the result
        if use_cache:
            _query_rewrite_cache[query_hash] = improved

        logger.info(f"[REWRITE] '{question[:50]}...' → '{improved[:50]}...'")
        return improved
    except Exception as e:
        logger.warning(f"[REWRITE] Failed to rewrite query: {e}")
        return question  # Fallback to original question

def clear_rewrite_cache():
    """Clear the query rewrite cache."""
    _query_rewrite_cache.clear()
    logger.info("[REWRITE] Cache cleared")


# ============================================================================
# HALLUCINATION GRADING
# ============================================================================

HALLUCINATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a fact-checking grader. Your task is to determine if an answer is grounded in the provided context.

GRADING CRITERIA:
- "yes" = ALL claims in the answer can be traced to the context
- "no" = The answer contains information NOT found in the context

Be strict: if ANY part of the answer is not supported by the context, grade "no".
Respond with ONLY "yes" or "no"."""),
    ("human", """<context>
{context}
</context>

<answer>
{answer}
</answer>

Is every claim in the answer grounded in the context? (yes/no):""")
])

def grade_hallucination(docs: List[Document], answer: str, llm, max_context_len: int = 4000) -> str:
    """
    Checks if the generated answer is grounded in the given documents.

    Args:
        docs: List of retrieved documents.
        answer: The generated answer.
        llm: The LLM used for grading.
        max_context_len: Max character length of the combined context.

    Returns:
        "yes" or "no" based on grounding.
    """
    if not docs or not answer:
        return "no"

    try:
        # Include source info in context for better grading
        context_parts = []
        for i, doc in enumerate(docs):
            source = doc.metadata.get("source", f"Document {i+1}")
            context_parts.append(f"[Source: {source}]\n{doc.page_content}")

        context = "\n\n---\n\n".join(context_parts)[:max_context_len]
        chain = HALLUCINATION_PROMPT | llm | StrOutputParser()
        result = chain.invoke({"context": context, "answer": answer}).strip().lower()

        # Parse response - look for yes/no anywhere in response
        if "yes" in result and "no" not in result:
            grade = "yes"
        elif "no" in result:
            grade = "no"
        else:
            logger.warning(f"[HALLUCINATION] Unexpected result: {result}")
            grade = "yes"  # Default to safe

        logger.info(f"[HALLUCINATION] Grade: {grade}")
        return grade
    except Exception as e:
        logger.warning(f"[HALLUCINATION] Grading failed: {e}")
        return "yes"  # Assume safe if uncertain


# ============================================================================
# ANSWER RELEVANCE GRADING
# ============================================================================

ANSWER_RELEVANCE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a relevance grader. Your task is to determine if an answer adequately addresses the user's question.

GRADING CRITERIA:
- "yes" = The answer directly addresses the question and provides useful information
- "no" = The answer is off-topic, too vague, or doesn't help the user

Respond with ONLY "yes" or "no"."""),
    ("human", """<question>
{question}
</question>

<answer>
{answer}
</answer>

Does this answer adequately address the question? (yes/no):""")
])

def grade_answer_relevance(question: str, answer: str, llm) -> str:
    """
    Checks if the generated answer is relevant and addresses the user's question.

    Args:
        question: The original user question.
        answer: The generated LLM answer.
        llm: The LLM used for grading.

    Returns:
        "yes" or "no" indicating relevance.
    """
    if not question or not answer:
        return "no"

    try:
        chain = ANSWER_RELEVANCE_PROMPT | llm | StrOutputParser()
        result = chain.invoke({"question": question, "answer": answer}).strip().lower()

        # Parse response
        if "yes" in result and "no" not in result:
            grade = "yes"
        elif "no" in result:
            grade = "no"
        else:
            logger.warning(f"[RELEVANCE] Unexpected result: {result}")
            grade = "yes"

        logger.info(f"[RELEVANCE] Grade: {grade}")
        return grade
    except Exception as e:
        logger.warning(f"[RELEVANCE] Grading failed: {e}")
        return "yes"  # Assume safe if unsure


# ============================================================================
# DOCUMENT RELEVANCE GRADING (NEW - for pre-filtering)
# ============================================================================

DOC_RELEVANCE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a document relevance grader. Determine if a document contains information relevant to answering the query.

GRADING:
- "relevant" = Document contains information useful for answering the query
- "irrelevant" = Document is off-topic or doesn't help answer the query

Respond with ONLY "relevant" or "irrelevant"."""),
    ("human", """<query>
{query}
</query>

<document>
{document}
</document>

Is this document relevant to the query? (relevant/irrelevant):""")
])

def grade_document_relevance(query: str, doc: Document, llm) -> str:
    """
    Grade whether a document is relevant to a query.
    Used for pre-filtering retrieved documents before generation.

    Args:
        query: The user's query.
        doc: The document to grade.
        llm: The LLM used for grading.

    Returns:
        "relevant" or "irrelevant"
    """
    try:
        # Truncate document to reasonable size
        doc_content = doc.page_content[:2000]
        chain = DOC_RELEVANCE_PROMPT | llm | StrOutputParser()
        result = chain.invoke({"query": query, "document": doc_content}).strip().lower()

        if "relevant" in result and "irrelevant" not in result:
            grade = "relevant"
        else:
            grade = "irrelevant"

        source = doc.metadata.get("source", "unknown")
        logger.debug(f"[DOC_RELEVANCE] {source}: {grade}")
        return grade
    except Exception as e:
        logger.warning(f"[DOC_RELEVANCE] Grading failed: {e}")
        return "relevant"  # Default to including document


def filter_relevant_documents(query: str, docs: List[Document], llm, min_docs: int = 1) -> List[Document]:
    """
    Filter documents to only include those relevant to the query.
    Uses batch processing (1 LLM call) instead of individual calls.

    Args:
        query: The user's query.
        docs: List of documents to filter.
        llm: The LLM used for grading.
        min_docs: Minimum number of documents to return (even if irrelevant).

    Returns:
        List of relevant documents.
    """
    if not docs:
        return []

    # For small number of docs, just return all
    if len(docs) <= min_docs:
        return docs

    # Use batch filtering for efficiency
    relevant = batch_filter_documents(query, docs, llm)

    # Ensure we return at least min_docs
    if len(relevant) < min_docs:
        logger.warning(f"[DOC_FILTER] Only {len(relevant)} relevant docs, returning top {min_docs}")
        return docs[:min_docs]

    logger.info(f"[DOC_FILTER] Filtered {len(docs)} → {len(relevant)} relevant docs")
    return relevant


# ============================================================================
# BATCH DOCUMENT FILTERING (Single LLM call for all documents)
# ============================================================================

BATCH_DOC_RELEVANCE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a document relevance grader. Given a query and multiple documents, determine which documents are relevant.

OUTPUT FORMAT:
Return ONLY a comma-separated list of document numbers that are relevant.
If none are relevant, return "none".
If all are relevant, return "all".

Example outputs:
- "1,3,4" (documents 1, 3, and 4 are relevant)
- "all" (all documents are relevant)
- "none" (no documents are relevant)
- "2" (only document 2 is relevant)"""),
    ("human", """<query>
{query}
</query>

<documents>
{documents}
</documents>

Which document numbers are relevant to answering the query?""")
])


def batch_filter_documents(query: str, docs: List[Document], llm) -> List[Document]:
    """
    Filter documents using a single LLM call (batch processing).

    Args:
        query: The user's query.
        docs: List of documents to filter.
        llm: The LLM used for grading.

    Returns:
        List of relevant documents.
    """
    if not docs:
        return []

    if len(docs) == 1:
        # Single doc - use simple check
        grade = grade_document_relevance(query, docs[0], llm)
        return docs if grade == "relevant" else []

    try:
        # Format documents for batch processing
        doc_texts = []
        for i, doc in enumerate(docs):
            source = doc.metadata.get("source", f"Document {i+1}")
            # Truncate each doc to reasonable size
            content = doc.page_content[:500]
            doc_texts.append(f"[Document {i+1}] (Source: {source})\n{content}")

        documents_str = "\n\n---\n\n".join(doc_texts)

        # Single LLM call
        chain = BATCH_DOC_RELEVANCE_PROMPT | llm | StrOutputParser()
        result = chain.invoke({"query": query, "documents": documents_str}).strip().lower()

        logger.debug(f"[BATCH_FILTER] LLM response: {result}")

        # Parse result
        if result == "none":
            return []
        elif result == "all":
            return docs

        # Parse comma-separated numbers
        relevant_indices = []
        for part in result.replace(" ", "").split(","):
            try:
                idx = int(part) - 1  # Convert to 0-indexed
                if 0 <= idx < len(docs):
                    relevant_indices.append(idx)
            except ValueError:
                continue

        if not relevant_indices:
            logger.warning(f"[BATCH_FILTER] Could not parse result: {result}")
            return docs[:2]  # Fallback to first 2

        relevant_docs = [docs[i] for i in relevant_indices]
        logger.info(f"[BATCH_FILTER] Selected {len(relevant_docs)} of {len(docs)} docs")
        return relevant_docs

    except Exception as e:
        logger.warning(f"[BATCH_FILTER] Failed: {e}, returning all docs")
        return docs
