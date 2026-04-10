"""
Compatibility package.

The codebase in this folder uses imports like `from rag.server.app import ...`,
but the project directory is named `engagemind-rag` (hyphenated), so `rag/` does
not exist by default.

This package bridges that gap by aliasing the existing top-level modules
(`server`, `retrieval`, `utils`, etc.) into the `rag.*` import namespace.
"""

from __future__ import annotations

import importlib
import sys


def _alias(real_module_name: str) -> None:
    """
    Expose a top-level module (e.g. `server`) as `rag.server` in `sys.modules`.
    """
    real_mod = importlib.import_module(real_module_name)
    sys.modules[f"{__name__}.{real_module_name}"] = real_mod


# Keep this list focused on what is needed to run the RAG server.
# (fine_tune + evaluation are provided via wrapper modules under this package.)
for _name in [
    "config",
    "logger_setup",
    "utils",
    "retrieval",
    "server",
    "ingestion",
]:
    _alias(_name)

