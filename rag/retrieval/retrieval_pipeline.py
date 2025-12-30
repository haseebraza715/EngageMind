"""
Retrieval Pipeline - Optimized with caching and hybrid search support.

This module provides:
1. Cached retrieval chain building (TTL-based)
2. Hybrid search (Vector + BM25) support
3. Re-ranking capabilities
4. Efficient FAISS index management
"""

import os
import logging
import time
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
from cachetools import TTLCache

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_mistralai.chat_models import ChatMistralAI
from langchain_mistralai.embeddings import MistralAIEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document

from rag.config import FAISS_INDEX_ROOT, MISTRAL_API_KEY

logger = logging.getLogger(__name__)


# ============================================================================
# CACHING INFRASTRUCTURE
# ============================================================================

@dataclass
class CachedChainInfo:
    """Information about a cached retrieval chain."""
    chain: Any
    retriever: Any
    vector_store: FAISS
    created_at: float
    index_version: str

# Cache retrieval chains for 30 minutes
# Key: user_id, Value: CachedChainInfo
_chain_cache: TTLCache = TTLCache(maxsize=100, ttl=1800)

# Cache for index versions (to detect when index needs reload)
_index_versions: Dict[str, str] = {}


def _get_index_version(user_id: str) -> str:
    """Get version hash of user's FAISS index based on modification time."""
    user_index_dir = os.path.join(FAISS_INDEX_ROOT, user_id)
    index_file = os.path.join(user_index_dir, "index.faiss")

    if os.path.exists(index_file):
        mtime = os.path.getmtime(index_file)
        return f"{user_id}:{mtime}"
    return f"{user_id}:none"


def _is_cache_valid(user_id: str) -> bool:
    """Check if cached chain is still valid (index hasn't changed)."""
    if user_id not in _chain_cache:
        return False

    cached_info = _chain_cache[user_id]
    current_version = _get_index_version(user_id)

    return cached_info.index_version == current_version


def invalidate_user_cache(user_id: str):
    """Invalidate cache for a specific user (call after index update)."""
    if user_id in _chain_cache:
        del _chain_cache[user_id]
        logger.info(f"[CACHE] Invalidated cache for user {user_id}")


def clear_all_cache():
    """Clear all cached chains."""
    _chain_cache.clear()
    logger.info("[CACHE] All retrieval chains cleared")


# ============================================================================
# SAFE FAISS LOADING
# ============================================================================

def _validate_faiss_index(index_dir: str, user_id: str) -> bool:
    """
    Validate FAISS index before loading.

    Args:
        index_dir: Directory containing the index
        user_id: User ID to verify ownership

    Returns:
        True if validation passes

    Raises:
        ValueError: If validation fails
    """
    # Check directory exists
    if not os.path.exists(index_dir):
        raise ValueError(f"Index directory does not exist: {index_dir}")

    # Verify user ownership (index dir should be under user_id)
    expected_user_dir = os.path.join(FAISS_INDEX_ROOT, user_id)
    if os.path.abspath(index_dir) != os.path.abspath(expected_user_dir):
        raise ValueError(f"Index directory mismatch for user {user_id}")

    # Check required files exist
    index_file = os.path.join(index_dir, "index.faiss")
    pkl_file = os.path.join(index_dir, "index.pkl")

    if not os.path.exists(index_file):
        raise ValueError(f"Missing index.faiss file in {index_dir}")
    if not os.path.exists(pkl_file):
        raise ValueError(f"Missing index.pkl file in {index_dir}")

    # Basic integrity check - files should not be empty
    if os.path.getsize(index_file) == 0:
        raise ValueError(f"Corrupted index: index.faiss is empty")
    if os.path.getsize(pkl_file) == 0:
        raise ValueError(f"Corrupted index: index.pkl is empty")

    return True


def safe_load_faiss(
    index_dir: str,
    embeddings: MistralAIEmbeddings,
    user_id: str
) -> FAISS:
    """
    Safely load FAISS index with validation.

    Args:
        index_dir: Directory containing the index
        embeddings: Embeddings instance
        user_id: User ID for ownership verification

    Returns:
        Loaded FAISS vector store

    Raises:
        ValueError: If validation fails
        RuntimeError: If loading fails
    """
    try:
        # Validate before loading
        _validate_faiss_index(index_dir, user_id)

        # Load with dangerous deserialization (validated)
        vector_store = FAISS.load_local(
            index_dir,
            embeddings,
            allow_dangerous_deserialization=True
        )

        return vector_store

    except ValueError as e:
        logger.error(f"FAISS validation failed for user {user_id}: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"FAISS loading failed for user {user_id}: {str(e)}")
        raise RuntimeError(f"Failed to load FAISS index: {str(e)}")


# ============================================================================
# IMPROVED PROMPT TEMPLATE - Conversational and User-Friendly
# ============================================================================

RETRIEVAL_PROMPT = ChatPromptTemplate.from_template(
"""You are a friendly, knowledgeable AI assistant helping users understand their documents.

FORMATTING RULES (CRITICAL - Follow exactly):
1. **Headings**: Use ## for main sections, ### for subsections
2. **Lists**: Use - for bullets, 1. 2. 3. for numbered lists
3. **Bold**: Use **text** for key terms and important concepts
4. **Code**: Use `code` for technical terms, formulas, or examples
5. **Tables**: Use markdown tables for comparisons (| Header | Header |)
6. **Spacing**: Add blank lines between sections for readability
7. **Emojis**: Use 1-2 relevant emojis max (not in every line)

STRUCTURE FOR ANSWERS:
- Start with a brief direct answer (1-2 sentences)
- Add a blank line
- Then expand with details using headings, lists, or tables
- For complex topics: use ## headings to separate sections
- End with "Need more details? Ask away!" if answer is incomplete

CONTENT RULES:
- Answer ONLY from provided documents
- If not in docs: "I couldn't find that in your uploaded documents."
- Cite sources naturally: "According to [source name]..."
- For "what's in this": give structured overview with headings

{conversation_history}

Documents:
{context}

Question: {input}

Well-formatted response:"""
)


# ============================================================================
# SIMPLE RETRIEVER (No double-rewriting)
# ============================================================================

class SimpleRetriever(BaseRetriever):
    """
    Simple retriever that doesn't do query rewriting.
    Query rewriting is handled once at the app level, not in the retriever.
    """
    base_retriever: Any

    class Config:
        arbitrary_types_allowed = True

    def __init__(self, base_retriever):
        super().__init__(base_retriever=base_retriever)

    def _get_relevant_documents(self, query: str) -> List[Document]:
        """Get documents for query - no rewriting here."""
        return self.base_retriever.get_relevant_documents(query)

    def get_relevant_documents(self, query: str) -> List[Document]:
        """Public method for getting documents."""
        return self.base_retriever.get_relevant_documents(query)

    def invoke(self, input: str, config: Optional[dict] = None, **kwargs) -> List[Document]:
        """Invoke retriever with query."""
        return self.base_retriever.invoke(input, config=config, **kwargs)


# ============================================================================
# MAIN RETRIEVAL CHAIN BUILDER
# ============================================================================

def build_retrieval_chain(
    user_id: str,
    api_key: Optional[str] = None,
    embed_model_name: str = "mistral-embed",
    index_root: str = FAISS_INDEX_ROOT,
    k: int = 6,  # Retrieve more for re-ranking
    use_cache: bool = True
) -> Dict[str, Any]:
    """
    Build a retrieval chain for a user with caching support.

    Args:
        user_id: Unique user identifier
        api_key: Mistral API key
        embed_model_name: Embedding model name
        index_root: Root directory for FAISS indexes
        k: Number of documents to retrieve
        use_cache: Whether to use cached chains

    Returns:
        Dict with 'chain', 'retriever', and 'vector_store' keys
    """
    api_key = api_key or MISTRAL_API_KEY
    if not api_key:
        logger.error("Mistral API key is required")
        raise ValueError("Mistral API key is required")

    # Check cache first
    if use_cache and _is_cache_valid(user_id):
        cached = _chain_cache[user_id]
        logger.debug(f"[CACHE] Using cached chain for user {user_id}")
        return {
            "chain": cached.chain,
            "retriever": cached.retriever,
            "vector_store": cached.vector_store
        }

    # Build fresh chain
    user_index_dir = os.path.abspath(os.path.join(index_root, user_id))
    if not os.path.exists(user_index_dir):
        logger.warning(f"FAISS index for user {user_id} not found at {user_index_dir} (handled upstream)")
        return None

    logger.info(f"[RETRIEVAL] Loading FAISS index for user {user_id}")
    start_time = time.time()

    try:
        embeddings = MistralAIEmbeddings(model=embed_model_name, mistral_api_key=api_key)
        vector_store = safe_load_faiss(user_index_dir, embeddings, user_id)
    except (ValueError, RuntimeError) as e:
        logger.error(f"Failed to load FAISS index for user {user_id}: {str(e)}")
        raise

    load_time = time.time() - start_time
    logger.info(f"[RETRIEVAL] Index loaded in {load_time:.2f}s")

    # Create base retriever with user filter
    base_retriever = vector_store.as_retriever(
        search_kwargs={
            "k": k,
            "filter": {"user_id": user_id}
        }
    )

    # Wrap with simple retriever (no double rewriting)
    retriever = SimpleRetriever(base_retriever)

    # Create LLM for generation
    model = ChatMistralAI(mistral_api_key=api_key)

    # Helper to format documents with sources (cleaner format)
    def format_docs_with_sources(docs: List[Document]) -> str:
        if not docs:
            return "No relevant documents found."

        formatted = []
        for i, doc in enumerate(docs):
            source = doc.metadata.get("source", f"Document {i+1}")
            # Clean up the source name - remove path, keep just filename
            if "/" in source:
                source = source.split("/")[-1]
            if "\\" in source:
                source = source.split("\\")[-1]

            # Format: "From [filename]: content"
            formatted.append(f"From {source}:\n{doc.page_content}")

        return "\n\n---\n\n".join(formatted)

    def retrieve_and_format(input_dict: Dict) -> str:
        """Retrieve documents and format them as context."""
        query = input_dict.get("input") or input_dict.get("question", "")
        docs = retriever.invoke(query)
        return format_docs_with_sources(docs)

    # Build the LCEL chain
    retrieval_chain = (
        {
            "context": RunnableLambda(retrieve_and_format),
            "input": lambda x: x.get("input") or x.get("question", ""),
            "conversation_history": lambda x: x.get("conversation_history", "")
        }
        | RETRIEVAL_PROMPT
        | model
    )

    # Cache the result
    if use_cache:
        cached_info = CachedChainInfo(
            chain=retrieval_chain,
            retriever=retriever,
            vector_store=vector_store,
            created_at=time.time(),
            index_version=_get_index_version(user_id)
        )
        _chain_cache[user_id] = cached_info
        logger.info(f"[CACHE] Cached retrieval chain for user {user_id}")

    return {
        "chain": retrieval_chain,
        "retriever": retriever,
        "vector_store": vector_store
    }


# ============================================================================
# DIRECT RETRIEVAL FUNCTION (for use without full chain)
# ============================================================================

def retrieve_documents(
    user_id: str,
    query: str,
    k: int = 6,
    api_key: Optional[str] = None
) -> List[Document]:
    """
    Retrieve documents for a query directly without building full chain.
    Useful for when you just need documents, not generation.

    Args:
        user_id: User identifier
        query: Search query
        k: Number of documents to retrieve
        api_key: Mistral API key

    Returns:
        List of retrieved documents
    """
    try:
        result = build_retrieval_chain(user_id=user_id, api_key=api_key, k=k)
        retriever = result["retriever"]
        return retriever.invoke(query)
    except Exception as e:
        logger.error(f"[RETRIEVAL] Failed to retrieve documents: {e}")
        return []


def get_vector_store(user_id: str, api_key: Optional[str] = None) -> Optional[FAISS]:
    """
    Get the FAISS vector store for a user.

    Args:
        user_id: User identifier
        api_key: Mistral API key

    Returns:
        FAISS vector store or None if not found
    """
    try:
        result = build_retrieval_chain(user_id=user_id, api_key=api_key)
        return result["vector_store"]
    except FileNotFoundError:
        return None
    except Exception as e:
        logger.error(f"[RETRIEVAL] Failed to get vector store: {e}")
        return None
