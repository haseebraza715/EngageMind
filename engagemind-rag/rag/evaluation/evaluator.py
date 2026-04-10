"""
Wrapper for `rag.evaluation.evaluator`.

Re-exports functions from the real implementation in the top-level
`evaluation/` directory.
"""

from __future__ import annotations

from evaluation.evaluator import (
    detect_intent,
    filter_relevant_documents,
    grade_answer_relevance,
    grade_hallucination,
    rewrite_query,
)  # type: ignore

__all__ = [
    "detect_intent",
    "filter_relevant_documents",
    "grade_answer_relevance",
    "grade_hallucination",
    "rewrite_query",
]

