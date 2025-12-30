"""
Retry Logic with Exponential Backoff - Phase 4.4

Provides decorators and utilities for retrying operations that may fail transiently.
Uses exponential backoff to reduce load on failing services.
"""

import logging
from typing import Callable, Type, Tuple
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
    after_log
)

logger = logging.getLogger(__name__)


# ============================================================================
# RETRY DECORATORS
# ============================================================================

def retry_api_call(
    max_attempts: int = 3,
    min_wait: int = 2,
    max_wait: int = 10,
    exceptions: Tuple[Type[Exception], ...] = (TimeoutError, ConnectionError)
):
    """
    Decorator for API calls with exponential backoff.

    Args:
        max_attempts: Maximum number of retry attempts
        min_wait: Minimum wait time in seconds
        max_wait: Maximum wait time in seconds
        exceptions: Tuple of exception types to retry on

    Usage:
        @retry_api_call(max_attempts=3)
        def call_external_api():
            return requests.get("https://api.example.com")
    """
    return retry(
        stop=stop_after_attempt(max_attempts),
        wait=wait_exponential(multiplier=1, min=min_wait, max=max_wait),
        retry=retry_if_exception_type(exceptions),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        after=after_log(logger, logging.INFO),
        reraise=True
    )


def retry_mistral_call(max_attempts: int = 3):
    """
    Specialized retry for Mistral API calls.

    Retries on common Mistral API errors:
    - Rate limit errors
    - Timeout errors
    - Connection errors
    """
    return retry(
        stop=stop_after_attempt(max_attempts),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        retry=retry_if_exception_type((
            TimeoutError,
            ConnectionError,
            Exception  # Catch Mistral SDK exceptions
        )),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True
    )


def retry_mongodb_operation(max_attempts: int = 3):
    """
    Specialized retry for MongoDB operations.

    Retries on transient database failures:
    - Connection timeouts
    - Network errors
    - Temporary write/read failures
    """
    return retry(
        stop=stop_after_attempt(max_attempts),
        wait=wait_exponential(multiplier=1, min=1, max=5),
        retry=retry_if_exception_type((
            ConnectionError,
            TimeoutError,
            Exception  # Catch pymongo exceptions
        )),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True
    )


def retry_web_search(max_attempts: int = 2):
    """
    Retry for web search operations (Tavily).

    Less aggressive retries since web search is a fallback.
    """
    return retry(
        stop=stop_after_attempt(max_attempts),
        wait=wait_exponential(multiplier=1, min=2, max=8),
        retry=retry_if_exception_type((TimeoutError, ConnectionError)),
        before_sleep=before_sleep_log(logger, logging.WARNING),
        reraise=True
    )


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def with_fallback(func: Callable, fallback_value: any = None, log_errors: bool = True):
    """
    Execute function with fallback value on failure.

    Args:
        func: Function to execute
        fallback_value: Value to return on failure
        log_errors: Whether to log errors

    Returns:
        Function result or fallback value

    Usage:
        result = with_fallback(
            lambda: expensive_api_call(),
            fallback_value="default",
            log_errors=True
        )
    """
    try:
        return func()
    except Exception as e:
        if log_errors:
            logger.error(f"Operation failed, using fallback: {str(e)}")
        return fallback_value


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Example: Retry Mistral API call
    @retry_mistral_call(max_attempts=3)
    def embed_text(text: str):
        """Embed text with Mistral API (example)."""
        # This would be your actual API call
        import time
        time.sleep(0.1)  # Simulate API call
        return [0.1, 0.2, 0.3]  # Fake embedding

    # Example: Retry MongoDB operation
    @retry_mongodb_operation(max_attempts=3)
    def save_to_db(data: dict):
        """Save data to MongoDB (example)."""
        # This would be your actual DB operation
        pass

    # Example: Web search with fallback
    @retry_web_search(max_attempts=2)
    def search_web(query: str):
        """Search web with Tavily (example)."""
        # This would be your actual web search
        return []
