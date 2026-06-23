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
    r'^(yo[\s!.,?]+)?(what\'s up|whats up|what up|sup)[\s!.,?]*$',
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

# Meta capability/help queries that should NOT trigger document-grounded answer formatting.
_CAPABILITY_QUERY_PATTERNS = [
    re.compile(r'^\s*(what can you do|what do you do)\s*[\?!.]*\s*$', re.IGNORECASE),
    re.compile(r'^\s*(what do you know|what information do you have|what have you learned)\s*[\?!.]*\s*$', re.IGNORECASE),
    re.compile(r'^\s*(how can you help( me)?|can you help( me)?)\s*[\?!.]*\s*$', re.IGNORECASE),
    re.compile(r'^\s*(how do you work|what are your capabilities|what are you trained on)\s*[\?!.]*\s*$', re.IGNORECASE),
]

# Fuzzy match patterns for typo tolerance
_FUZZY_GREETINGS = ["hi", "hello", "hey", "hola"]
_FUZZY_THANKS = ["thanks", "thank you", "thx"]
_FUZZY_ACKNOWLEDGMENTS = ["no problem", "np", "no worries", "ok", "okay"]

_GREETING_OPENERS = {"hi", "hello", "hey", "yo", "heya", "howdy", "sup", "wassup"}
_CASUAL_ADDRESS_TERMS = {"g", "bro", "bruh", "man", "mate", "dude"}
_CASUAL_UP_PHRASES = [
    re.compile(r"^(?:hey|hi|hello|yo|heya|howdy)?\s*(?:what'?s|whats|what is|what)\s+up(?:\s+(?:g|bro|bruh|man|mate|dude))?$"),
    re.compile(r"^(?:hey|hi|hello|yo|heya|howdy)\s+(?:sup|wassup)(?:\s+(?:g|bro|bruh|man|mate|dude))?$"),
    re.compile(r"^(?:sup|wassup)(?:\s+(?:g|bro|bruh|man|mate|dude))?$"),
]
_SUMMARY_FOLLOWUP_PATTERN = re.compile(
    r"\b(summarize|summary|sum up|recap|explain)\b.*\b(it|that|this|them)\b"
)


def _normalize_social_text(text: str) -> str:
    """Normalize punctuation and spacing for small-talk intent checks."""
    normalized = re.sub(r"[^a-z0-9'\s]", " ", text.lower())
    return re.sub(r"\s+", " ", normalized).strip()


def _is_casual_greeting(message: str) -> bool:
    """Detect greeting-only slang without catching real document questions."""
    normalized = _normalize_social_text(message)
    if not normalized:
        return False

    for pattern in _CASUAL_UP_PHRASES:
        if pattern.match(normalized):
            return True

    tokens = normalized.split()
    if len(tokens) <= 3 and tokens[0] in _GREETING_OPENERS:
        return all(token in _GREETING_OPENERS or token in _CASUAL_ADDRESS_TERMS for token in tokens)

    return False


def _last_assistant_message(conversation_history: Optional[List[Dict[str, Any]]]) -> str:
    """Return the latest assistant text from prior conversation history."""
    if not conversation_history:
        return ""
    for item in reversed(conversation_history):
        if item.get("sender") == "assistant":
            return str(item.get("text", ""))
    return ""


def _is_capability_response(text: str) -> bool:
    """Detect EngageMind's own capability/help answer."""
    normalized = _normalize_social_text(text)
    return (
        "i know the content you upload into this workspace" in normalized
        or "i can help you understand your uploaded documents" in normalized
        or "i'm here to help you explore and understand your documents" in normalized
        or (
            "i can summarize uploaded documents" in normalized
            and "point to supporting evidence" in normalized
        )
    )


def _is_vague_summary_followup(message: str) -> bool:
    """Detect pronoun-based summary requests that need a clear target."""
    normalized = _normalize_social_text(message)
    return bool(_SUMMARY_FOLLOWUP_PATTERN.search(normalized))

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
    "capabilities": "I know the content you upload into this workspace. I can summarize uploaded documents, answer questions from them, extract key facts, compare sections, and point to supporting evidence when document context is available.",
    "clarify_summary_target": "Sure. If you mean an uploaded document, ask me to summarize the uploaded document or tell me the filename or section. Then I can summarize that content and point to evidence.",
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

    if _is_casual_greeting(message):
        if any(phrase in _normalize_social_text(message) for phrase in ["what up", "what is up", "whats up", "what's up", "sup", "wassup"]):
            return ("chitchat", CHITCHAT_RESPONSES["how_are_you"])
        greeting = _get_greeting_response(has_documents=True)
        return ("chitchat", greeting)

    last_assistant = _last_assistant_message(conversation_history)
    if _is_capability_response(last_assistant) and _is_vague_summary_followup(message):
        return ("chitchat", CHITCHAT_RESPONSES["clarify_summary_target"])

    # Capability/meta-help queries should get conversational response, not RAG formatting.
    for pattern in _CAPABILITY_QUERY_PATTERNS:
        if pattern.match(message):
            return ("chitchat", CHITCHAT_RESPONSES["capabilities"])

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
            elif any(h in message for h in ["how are you", "how's it going", "what's up", "whats up", "what up", "sup"]):
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


def _parse_prefixed_line(text: str, key: str) -> Optional[str]:
    """
    Parse a strict `KEY: value` line from model output.
    """
    pattern = rf"{re.escape(key)}\s*:\s*(.+)"
    match = re.search(pattern, text, flags=re.IGNORECASE)
    if not match:
        return None
    value = match.group(1).strip()
    return value if value else None


def _parse_yes_no_grade(text: str, default: str = "no") -> str:
    """
    Parse deterministic grading output from model response.
    Expected:
      RESULT: YES
      RESULT: NO
    """
    parsed = _parse_prefixed_line(text, "RESULT")
    if parsed:
        normalized = parsed.lower()
        if normalized.startswith("yes"):
            return "yes"
        if normalized.startswith("no"):
            return "no"

    lowered = text.lower()
    if re.search(r"\byes\b", lowered) and not re.search(r"\bno\b", lowered):
        return "yes"
    if re.search(r"\bno\b", lowered):
        return "no"
    return default


def _parse_relevance_grade(text: str, default: str = "irrelevant") -> str:
    """
    Parse deterministic document relevance output.
    Expected:
      RESULT: RELEVANT
      RESULT: IRRELEVANT
    """
    parsed = _parse_prefixed_line(text, "RESULT")
    if parsed:
        normalized = parsed.lower()
        if normalized.startswith("relevant") and not normalized.startswith("irrelevant"):
            return "relevant"
        if normalized.startswith("irrelevant"):
            return "irrelevant"

    lowered = text.lower()
    if re.search(r"\birrelevant\b", lowered):
        return "irrelevant"
    if re.search(r"\brelevant\b", lowered):
        return "relevant"
    return default


REWRITE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You optimize user questions for semantic retrieval.

Rules:
1. Preserve all named entities, numbers, dates, constraints, and intent.
2. Keep language close to the original question. Do NOT change meaning.
3. Expand abbreviations only when unambiguous.
4. Remove filler words and conversational fluff.
5. Keep output concise and search-oriented.
6. Output exactly one line in this format:
   REWRITE_QUERY: <rewritten query>
7. If rewrite is unnecessary, return the original question with the same format."""),
    ("human", "Original question:\n{question}")
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
        raw_output = chain.invoke({"question": question}).strip()
        improved = _parse_prefixed_line(raw_output, "REWRITE_QUERY") or raw_output

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
Respond using EXACTLY one line:
RESULT: YES
or
RESULT: NO"""),
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

        grade = _parse_yes_no_grade(result, default="no")

        logger.info(f"[HALLUCINATION] Grade: {grade}")
        return grade
    except Exception as e:
        logger.warning(f"[HALLUCINATION] Grading failed: {e}")
        return "no"


# ============================================================================
# ANSWER RELEVANCE GRADING
# ============================================================================

ANSWER_RELEVANCE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a relevance grader. Your task is to determine if an answer adequately addresses the user's question.

GRADING CRITERIA:
- "yes" = The answer directly addresses the question and provides useful information
- "no" = The answer is off-topic, too vague, or doesn't help the user

Respond using EXACTLY one line:
RESULT: YES
or
RESULT: NO"""),
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

        grade = _parse_yes_no_grade(result, default="no")

        logger.info(f"[RELEVANCE] Grade: {grade}")
        return grade
    except Exception as e:
        logger.warning(f"[RELEVANCE] Grading failed: {e}")
        return "no"


# ============================================================================
# DOCUMENT RELEVANCE GRADING (NEW - for pre-filtering)
# ============================================================================

DOC_RELEVANCE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are a document relevance grader. Determine if a document contains information relevant to answering the query.

GRADING:
- "relevant" = Document contains information useful for answering the query
- "irrelevant" = Document is off-topic or doesn't help answer the query

Respond using EXACTLY one line:
RESULT: RELEVANT
or
RESULT: IRRELEVANT"""),
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

        grade = _parse_relevance_grade(result, default="irrelevant")

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
Return EXACTLY one line:
RESULT: <value>

Allowed values:
- all
- none
- comma-separated document numbers like 1,3,4

Example outputs:
- RESULT: 1,3,4
- RESULT: all
- RESULT: none
- RESULT: 2"""),
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
        raw_result = chain.invoke({"query": query, "documents": documents_str}).strip()
        parsed_result = _parse_prefixed_line(raw_result, "RESULT")
        result = (parsed_result or raw_result).strip().lower()

        logger.debug(f"[BATCH_FILTER] LLM response: {result}")

        # Parse result
        if result == "none":
            return []
        elif result == "all":
            return docs

        # Parse comma-separated numbers
        relevant_indices = []
        normalized = result.replace(" ", "")
        normalized = re.sub(r"[^0-9,]", "", normalized)
        for part in normalized.split(","):
            try:
                idx = int(part) - 1  # Convert to 0-indexed
                if 0 <= idx < len(docs):
                    relevant_indices.append(idx)
            except ValueError:
                continue

        if not relevant_indices:
            logger.warning(f"[BATCH_FILTER] Could not parse result: {raw_result}")
            return docs[:2]  # Fallback to first 2

        relevant_docs = [docs[i] for i in relevant_indices]
        logger.info(f"[BATCH_FILTER] Selected {len(relevant_docs)} of {len(docs)} docs")
        return relevant_docs

    except Exception as e:
        logger.warning(f"[BATCH_FILTER] Failed: {e}, returning all docs")
        return docs
