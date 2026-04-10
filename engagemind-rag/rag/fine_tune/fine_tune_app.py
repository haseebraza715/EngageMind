"""
Wrapper for `rag.fine_tune.fine_tune_app`.

This re-exports the Flask `app` instance from the real implementation.
"""

from __future__ import annotations

from fine_tune.fine_tune_app import app  # type: ignore

__all__ = ["app"]

