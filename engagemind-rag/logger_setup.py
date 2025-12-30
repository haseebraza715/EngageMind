import logging
import sys
from config import LOG_LEVEL

LOG_FORMAT = "[%(asctime)s] [%(levelname)s] %(name)s - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logger() -> None:
    """
    Configure the root logger for the application with console output.
    Should be called early in the application startup.
    """
    level = getattr(logging, LOG_LEVEL.upper(), logging.INFO)

    # Create handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Avoid duplicate handlers
    if not root_logger.handlers:
        root_logger.addHandler(console_handler)
    else:
        # Replace existing handlers
        root_logger.handlers = [console_handler]

    root_logger.debug("Logger configured with level: %s", LOG_LEVEL)
