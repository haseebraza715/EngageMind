"""
Compatibility wrapper for legacy imports.

Primary implementation lives in `fine_tune/tasks/tasks.py`.
"""

from fine_tune.tasks.tasks import fine_tune_gpt2_lora

__all__ = ["fine_tune_gpt2_lora"]
