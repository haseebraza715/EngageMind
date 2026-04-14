"""
LangGraph conversation workflow for RAG pipeline.
"""

import logging
import time
import json
import re
from typing import Any, Dict, List, TypedDict
from dataclasses import dataclass

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import END, StateGraph

from rag.evaluation.evaluator import (
    rewrite_query,
    filter_relevant_documents,
    grade_hallucination,
    grade_answer_relevance,
)
from rag.utils.llm_factory import create_chat_llm

logger = logging.getLogger(__name__)


# ============================================================================
# METRICS
# ============================================================================

@dataclass
class RAGMetrics:
    """Metrics for a single RAG request."""
    user_id: str
    query: str
    rewrite_time_ms: float = 0
    retrieval_time_ms: float = 0
    filtering_time_ms: float = 0
    generation_time_ms: float = 0
    total_time_ms: float = 0
    docs_retrieved: int = 0
    docs_after_filter: int = 0
    hallucination_grade: str = ""
    relevance_grade: str = ""
    web_fallback_used: bool = False
    bad_response: bool = False
    cache_hit: bool = False

    def log(self):
        logger.info(
            f"[METRICS] User: {self.user_id} | "
            f"Rewrite: {self.rewrite_time_ms:.0f}ms | "
            f"Retrieve: {self.retrieval_time_ms:.0f}ms | "
            f"Filter: {self.filtering_time_ms:.0f}ms | "
            f"Generate: {self.generation_time_ms:.0f}ms | "
            f"Total: {self.total_time_ms:.0f}ms | "
            f"Docs: {self.docs_after_filter}/{self.docs_retrieved} | "
            f"Hallucination: {self.hallucination_grade} | "
            f"Relevance: {self.relevance_grade} | "
            f"WebFallback: {self.web_fallback_used} | "
            f"BadResponse: {self.bad_response}"
        )


# ============================================================================
# CONVERSATION STATE
# ============================================================================

class ConversationState(TypedDict):
    user_id: str
    messages: List[Dict[str, Any]]
    context: Dict[str, Any]
    current_message: str
    rewritten_query: str
    metrics: Dict[str, Any]


def _extract_source_tags(docs: List[Document]) -> List[str]:
    tags = []
    for idx, doc in enumerate(docs):
        source = doc.metadata.get("source", f"Document {idx+1}")
        if "/" in source:
            source = source.split("/")[-1]
        if "\\" in source:
            source = source.split("\\")[-1]
        tags.append(f"[source:{source}#chunk{idx+1}]")
    return tags


def _llm_metadata(llm: Any) -> Dict[str, str]:
    provider = getattr(llm, "_engagemind_provider", "unknown")
    model = getattr(llm, "_engagemind_model", None)
    if not model:
        model = getattr(llm, "model", None) or getattr(llm, "model_name", None) or "unknown"
    return {"provider": str(provider), "model": str(model)}


def _is_bad_response(answer: str, metrics: Dict[str, Any]) -> bool:
    lower = (answer or "").lower()
    fallback_markers = [
        "sorry, i encountered an error",
        "i encountered an issue processing your request",
        "i could not find this in the uploaded documents",
        "no supporting evidence found in provided context",
    ]
    is_error_like = any(marker in lower for marker in fallback_markers)
    hallucination_bad = metrics.get("hallucination_grade") == "no"
    relevance_bad = metrics.get("relevance_grade") == "no"
    return is_error_like or hallucination_bad or relevance_bad


def _invoke_with_retry(chain: Any, prompt_input: Dict[str, Any], max_attempts: int = 2) -> Any:
    """
    Invoke generation chain with a small retry budget to reduce transient provider errors.
    """
    last_error = None
    for attempt in range(1, max_attempts + 1):
        try:
            return chain.invoke(prompt_input)
        except Exception as exc:
            last_error = exc
            logger.warning("[GENERATE] LLM invoke attempt %s/%s failed: %s", attempt, max_attempts, exc)
            if attempt < max_attempts:
                time.sleep(0.75 * attempt)
    raise last_error


def _humanize_answer_citations(answer: str) -> str:
    """
    Keep citations visible but remove raw chunk IDs from user-facing text.
    Example:
      [source:file.pdf#chunk1] -> [source:file.pdf]
    """
    if not answer:
        return answer
    return re.sub(r"\[source:([^\]#]+)#chunk\d+\]", r"[source:\1]", answer)


# ============================================================================
# WEB FALLBACK
# ============================================================================

def perform_web_fallback(state: dict, user_id: str, query: str, tavily=None) -> dict:
    """
    Perform web search fallback when no documents are found.

    Args:
        state: Current conversation state
        user_id: User identifier
        query: Search query
        tavily: TavilyClient instance or None

    Returns:
        Updated state with web search results
    """
    if not tavily:
        logger.warning(f"[WEB FALLBACK] Tavily not available for user {user_id}")
        state["context"] = {
            "documents": [],
            "relevant_info": "No documents found. Please upload documents for better answers.",
            "web_fallback_used": False
        }
        return state

    try:
        logger.info(f"[WEB FALLBACK] Searching for: {query[:50]}...")
        results = tavily.search(query=query, max_results=3)
        snippets = [res.get("content", "") for res in results.get("results", [])]

        docs = [
            Document(
                page_content=snip,
                metadata={"source": "web_search", "user_id": user_id}
            )
            for snip in snippets if snip.strip()
        ]

        # Split for better context
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        web_docs = splitter.split_documents(docs)

        state["context"] = {
            "documents": web_docs,
            "relevant_info": "\n\n".join(doc.page_content for doc in web_docs),
            "web_fallback_used": True
        }

        logger.info(f"[WEB FALLBACK] Found {len(web_docs)} snippets for user {user_id}")

    except Exception as e:
        logger.exception(f"[WEB FALLBACK] Error: {e}")
        state["context"] = {
            "documents": [],
            "relevant_info": "An error occurred during web search.",
            "web_fallback_used": True
        }

    return state


# ============================================================================
# RAG PIPELINE NODES
# ============================================================================

def retrieve_context(state: dict, retrieval_chain_factory, llm) -> dict:
    """
    Retrieve relevant context from documents.

    This node:
    1. Rewrites the query ONCE and caches it
    2. Retrieves documents using cached chain
    3. Pre-filters documents for relevance

    Args:
        state: Current conversation state
        retrieval_chain_factory: Function to build retrieval chain
        llm: LLM instance

    Returns:
        Updated state with retrieved context
    """
    user_id = state.get("user_id")
    current_message = state.get("current_message", "")
    metrics = state.get("metrics", {})

    # Build conversation history
    messages = state.get("messages", [])
    conversation_history = "\n".join(
        f"{msg['sender'].capitalize()}: {msg['text']}"
        for msg in messages[-10:]
        if isinstance(msg, dict) and "sender" in msg and "text" in msg
    )

    try:
        # Step 1: Rewrite query ONCE (uses caching internally)
        start_time = time.time()
        if not state.get("rewritten_query"):
            state["rewritten_query"] = rewrite_query(current_message, llm)
        rewrite_time = (time.time() - start_time) * 1000
        metrics["rewrite_time_ms"] = rewrite_time

        better_query = state["rewritten_query"]
        logger.info(f"[RETRIEVE] Query rewritten: {better_query[:50]}...")

        # Step 2: Build/get cached retrieval chain
        start_time = time.time()
        retrieval_result = retrieval_chain_factory(user_id=user_id)

        # Handle case where no index exists
        if retrieval_result is None:
            logger.warning(f"[RETRIEVE] No retrieval chain for user {user_id} (index missing)")
            state["context"] = {
                "documents": [],
                "relevant_info": "No documents found. Please upload files first.",
                "web_fallback_used": False
            }
            return state

        chain = retrieval_result["chain"]
        retriever = retrieval_result["retriever"]

        # Get source documents
        source_docs = retriever.invoke(better_query) if retriever else []
        retrieval_time = (time.time() - start_time) * 1000
        metrics["retrieval_time_ms"] = retrieval_time
        metrics["docs_retrieved"] = len(source_docs)

        logger.info(f"[RETRIEVE] Found {len(source_docs)} documents in {retrieval_time:.0f}ms")

        # Step 3: Pre-filter documents for relevance
        start_time = time.time()
        if len(source_docs) > 2:
            relevant_docs = filter_relevant_documents(better_query, source_docs, llm, min_docs=2)
        else:
            relevant_docs = source_docs
        filter_time = (time.time() - start_time) * 1000
        metrics["filtering_time_ms"] = filter_time
        metrics["docs_after_filter"] = len(relevant_docs)

        # Format context with sources
        context_parts = []
        for i, doc in enumerate(relevant_docs):
            source = doc.metadata.get("source", f"Document {i+1}")
            context_parts.append(f"[Source: {source}]\n{doc.page_content}")

        relevant_info = "\n\n---\n\n".join(context_parts)

        state["context"] = {
            "documents": relevant_docs,
            "relevant_info": relevant_info,
            "web_fallback_used": False
        }
        state["metrics"] = metrics

    except Exception as e:
        logger.exception(f"[RETRIEVE] Error for user {user_id}: {e}")
        state["context"] = {
            "documents": [],
            "relevant_info": "Error retrieving context. Please try again.",
            "web_fallback_used": False
        }

    return state


def generate_response(state: dict, llm, retrieval_chain, tavily=None, skip_quality_checks: bool = True) -> dict:
    """
    Generate a response using the LLM with quality checks.

    This node:
    1. Uses web fallback if no documents
    2. Generates response with context
    3. Runs hallucination and relevance checks (optional)
    4. Adds disclaimers if quality checks fail

    Args:
        state: Current conversation state
        llm: LLM instance
        retrieval_chain: Retrieval chain factory
        tavily: TavilyClient instance or None
        skip_quality_checks: Skip quality checks for speed

    Returns:
        Updated state with generated response
    """
    user_id = state.get("user_id")
    current_message = state.get("current_message", "").strip()
    rewritten_query = state.get("rewritten_query", current_message)
    messages = state.get("messages", [])
    metrics = state.get("metrics", {})
    docs: List[Document] = []

    # Build conversation history
    conversation_history = "\n".join(
        f"{msg['sender'].capitalize()}: {msg['text']}"
        for msg in messages if msg.get("text")
    )

    try:
        # Get retrieval chain
        retrieval_result = retrieval_chain(user_id=user_id)
        chain = retrieval_result["chain"]
        docs = state.get("context", {}).get("documents", [])

        # Case 1: No documents - use web fallback
        if not docs:
            logger.warning(f"[GENERATE] No documents for user {user_id}, using web fallback")
            state = perform_web_fallback(state, user_id, rewritten_query, tavily)
            docs = state.get("context", {}).get("documents", [])
            metrics["web_fallback_used"] = True

        # Build prompt input
        prompt_input = {
            "input": current_message,
            "conversation_history": conversation_history,
            "context": state["context"].get("relevant_info", "")
        }

        # Generate response
        start_time = time.time()
        response = _invoke_with_retry(chain, prompt_input, max_attempts=2)

        # Extract answer from response
        if hasattr(response, 'content'):
            answer = response.content
        elif isinstance(response, dict):
            answer = response.get("answer", response.get("content", ""))
        else:
            answer = str(response)

        generation_time = (time.time() - start_time) * 1000
        metrics["generation_time_ms"] = generation_time

        # Quality checks (optional)
        if not skip_quality_checks and docs and not state.get("context", {}).get("web_fallback_used", False):
            hallucination = grade_hallucination(docs, answer, llm)
            relevance = grade_answer_relevance(current_message, answer, llm)
            metrics["hallucination_grade"] = hallucination
            metrics["relevance_grade"] = relevance
            logger.info(f"[QUALITY] Hallucination: {hallucination}, Relevance: {relevance}")
        else:
            metrics["hallucination_grade"] = "skipped"
            metrics["relevance_grade"] = "skipped"

    except FileNotFoundError as e:
        logger.warning(f"[GENERATE] No index for user {user_id}")
        answer = str(e)
    except Exception as e:
        logger.exception(f"[GENERATE] Error for user {user_id}: {e}")
        answer = "Sorry, I encountered an error. Please try again."

    raw_answer = answer
    answer = _humanize_answer_citations(raw_answer)

    # Add assistant message to state
    state["messages"].append({
        "sender": "assistant",
        "text": answer,
        "timestamp": int(time.time())
    })

    # Calculate total time
    total_time = (
        metrics.get("rewrite_time_ms", 0) +
        metrics.get("retrieval_time_ms", 0) +
        metrics.get("filtering_time_ms", 0) +
        metrics.get("generation_time_ms", 0)
    )
    metrics["total_time_ms"] = total_time
    metrics["bad_response"] = _is_bad_response(raw_answer, metrics)
    metrics["retrieved_sources"] = _extract_source_tags(docs)
    metrics["llm"] = _llm_metadata(llm)

    if metrics["bad_response"]:
        logger.warning(
            "[BAD_RESPONSE] %s",
            json.dumps(
                {
                    "user_id": user_id,
                    "query": current_message,
                    "rewritten_query": rewritten_query,
                    "answer": answer,
                    "raw_answer": raw_answer,
                    "retrieved_sources": metrics.get("retrieved_sources", []),
                    "hallucination_grade": metrics.get("hallucination_grade"),
                    "relevance_grade": metrics.get("relevance_grade"),
                    "web_fallback_used": metrics.get("web_fallback_used", False),
                    "provider": metrics.get("llm", {}).get("provider"),
                    "model": metrics.get("llm", {}).get("model"),
                },
                ensure_ascii=False,
            ),
        )

    # Log metrics
    rag_metrics = RAGMetrics(
        user_id=user_id,
        query=current_message[:50],
        rewrite_time_ms=metrics.get("rewrite_time_ms", 0),
        retrieval_time_ms=metrics.get("retrieval_time_ms", 0),
        filtering_time_ms=metrics.get("filtering_time_ms", 0),
        generation_time_ms=metrics.get("generation_time_ms", 0),
        total_time_ms=total_time,
        docs_retrieved=metrics.get("docs_retrieved", 0),
        docs_after_filter=metrics.get("docs_after_filter", 0),
        hallucination_grade=metrics.get("hallucination_grade", ""),
        relevance_grade=metrics.get("relevance_grade", ""),
        web_fallback_used=metrics.get("web_fallback_used", False),
        bad_response=metrics.get("bad_response", False),
    )
    rag_metrics.log()

    state["metrics"] = metrics
    return state


# ============================================================================
# CONVERSATION GRAPH
# ============================================================================

def build_conversation_graph(api_key: str, retrieval_chain_factory, tavily=None, skip_quality_checks: bool = True):
    """Build the LangGraph conversation workflow."""
    workflow = StateGraph(ConversationState)
    llm = create_chat_llm(mistral_api_key=api_key, purpose="chat")

    # Add nodes
    workflow.add_node(
        "retrieve_context",
        lambda state: retrieve_context(state, retrieval_chain_factory, llm)
    )
    workflow.add_node(
        "generate_response",
        lambda state: generate_response(state, llm, retrieval_chain_factory, tavily, skip_quality_checks)
    )

    # Add edges
    workflow.add_edge("retrieve_context", "generate_response")
    workflow.add_edge("generate_response", END)
    workflow.set_entry_point("retrieve_context")

    return workflow.compile()
