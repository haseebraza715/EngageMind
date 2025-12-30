"""
Circuit Breaker Pattern for External API Calls - Phase 4.2

Prevents cascading failures by failing fast when external services are down.
Implements automatic recovery testing after timeout period.
"""

import logging
from typing import Any, Callable
from pybreaker import CircuitBreaker, CircuitBreakerError

logger = logging.getLogger(__name__)


# ============================================================================
# CIRCUIT BREAKER CONFIGURATION
# ============================================================================

# Mistral API Circuit Breaker
mistral_breaker = CircuitBreaker(
    fail_max=5,              # Open circuit after 5 consecutive failures
    reset_timeout=60,        # Keep circuit open for 60 seconds
    name='mistral_api',
    listeners=[]
)


# Tavily Web Search Circuit Breaker
tavily_breaker = CircuitBreaker(
    fail_max=3,              # Open after 3 failures (less critical)
    reset_timeout=30,        # Shorter recovery time
    name='tavily_api',
    listeners=[]
)


# MongoDB Circuit Breaker
mongodb_breaker = CircuitBreaker(
    fail_max=3,
    reset_timeout=10,        # Quick recovery for DB
    name='mongodb',
    listeners=[]
)


# ============================================================================
# CIRCUIT BREAKER DECORATORS
# ============================================================================

def with_mistral_breaker(func: Callable) -> Callable:
    """
    Decorator to wrap Mistral API calls with circuit breaker.

    Usage:
        @with_mistral_breaker
        def call_mistral_chat(...):
            return mistral_client.chat(...)
    """
    @mistral_breaker
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


def with_tavily_breaker(func: Callable) -> Callable:
    """Decorator for Tavily API calls."""
    @tavily_breaker
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


def with_mongodb_breaker(func: Callable) -> Callable:
    """Decorator for MongoDB operations."""
    @mongodb_breaker
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper


# ============================================================================
# FALLBACK STRATEGIES
# ============================================================================

def get_fallback_response(error: Exception, service: str = "service") -> dict:
    """
    Generate fallback response when circuit is open.

    Args:
        error: The circuit breaker error
        service: Service name for logging

    Returns:
        Dict with error info and retry suggestion
    """
    logger.warning(f"{service} circuit breaker is OPEN - failing fast")
    return {
        "error": "service_unavailable",
        "message": f"{service} is temporarily unavailable. Please try again in a moment.",
        "circuit_state": "open",
        "retry_after": 60
    }


# ============================================================================
# CIRCUIT STATE MONITORING
# ============================================================================

def get_circuit_states() -> dict:
    """
    Get current state of all circuit breakers.

    Returns:
        Dict with state info for all circuits
    """
    return {
        "mistral_api": {
            "state": mistral_breaker.current_state,
            "fail_counter": mistral_breaker.fail_counter,
            "fail_max": mistral_breaker.fail_max,
            "reset_timeout": mistral_breaker._reset_timeout
        },
        "tavily_api": {
            "state": tavily_breaker.current_state,
            "fail_counter": tavily_breaker.fail_counter,
            "fail_max": tavily_breaker.fail_max,
            "reset_timeout": tavily_breaker._reset_timeout
        },
        "mongodb": {
            "state": mongodb_breaker.current_state,
            "fail_counter": mongodb_breaker.fail_counter,
            "fail_max": mongodb_breaker.fail_max,
            "reset_timeout": mongodb_breaker._reset_timeout
        }
    }


def reset_all_breakers():
    """Reset all circuit breakers (for testing/admin use)."""
    mistral_breaker.reset()
    tavily_breaker.reset()
    mongodb_breaker.reset()
    logger.info("All circuit breakers reset")
