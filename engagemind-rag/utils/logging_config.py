"""
Structured Logging Configuration - Phase 4.5

Provides JSON-formatted structured logging for better log aggregation and filtering.
Compatible with log management systems like ELK, Datadog, etc.
"""

import logging
import sys
import structlog
from typing import Any


# ============================================================================
# STRUCTLOG CONFIGURATION
# ============================================================================

def configure_structured_logging(log_level: str = "INFO", json_output: bool = True):
    """
    Configure structured logging for the application.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_output: Whether to output JSON format (True) or console-friendly (False)
    """
    # Convert log level string to logging constant
    level = getattr(logging, log_level.upper(), logging.INFO)

    # Shared processors for all loggers
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    if json_output:
        # Production: JSON output
        renderer = structlog.processors.JSONRenderer()
    else:
        # Development: Console-friendly output with colors
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    # Configure structlog
    structlog.configure(
        processors=shared_processors + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        cache_logger_on_first_use=True,
    )

    # Configure standard logging to use structlog
    formatter = structlog.stdlib.ProcessorFormatter(
        processor=renderer,
        foreign_pre_chain=shared_processors,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(level)

    # Suppress overly verbose third-party loggers
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("werkzeug").setLevel(logging.WARNING)
    logging.getLogger("pymongo").setLevel(logging.WARNING)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_logger(name: str = None) -> Any:
    """
    Get a structured logger instance.

    Args:
        name: Logger name (usually __name__)

    Returns:
        Structured logger instance

    Usage:
        logger = get_logger(__name__)
        logger.info("processing_request", user_id="123", request_id="abc")
    """
    return structlog.get_logger(name)


def bind_context(**kwargs):
    """
    Bind context variables that will be included in all subsequent log messages.

    Args:
        **kwargs: Key-value pairs to bind

    Usage:
        bind_context(user_id="123", session_id="abc")
        logger.info("user_action", action="login")  # Will include user_id and session_id
    """
    structlog.contextvars.bind_contextvars(**kwargs)


def clear_context():
    """Clear all bound context variables."""
    structlog.contextvars.clear_contextvars()


def unbind_context(*keys):
    """
    Unbind specific context variables.

    Args:
        *keys: Keys to unbind
    """
    structlog.contextvars.unbind_contextvars(*keys)


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    # Configure for development (console output with colors)
    configure_structured_logging(log_level="DEBUG", json_output=False)

    logger = get_logger(__name__)

    # Simple log
    logger.info("application_started", version="1.0.0")

    # Log with context
    bind_context(user_id="user_123", request_id="req_456")
    logger.info("processing_request", endpoint="/api/health")
    logger.warning("slow_response", duration_ms=1500, threshold_ms=1000)

    # Error with exception
    try:
        1 / 0
    except Exception:
        logger.exception("calculation_failed", operation="division")

    clear_context()

    # Production example (JSON output)
    print("\n--- Production mode (JSON) ---")
    configure_structured_logging(log_level="INFO", json_output=True)
    logger = get_logger("production")
    logger.info("api_request", method="POST", path="/api/conversation", status=200, duration_ms=120)
