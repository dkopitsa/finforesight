"""Logging configuration for the application."""

import logging
import logging.handlers
import sys
from datetime import UTC
from pathlib import Path
from typing import Any

from app.core.config import settings


class ColoredFormatter(logging.Formatter):
    """Custom formatter with colored output for development."""

    # ANSI color codes
    COLORS = {
        "DEBUG": "\033[36m",  # Cyan
        "INFO": "\033[32m",  # Green
        "WARNING": "\033[33m",  # Yellow
        "ERROR": "\033[31m",  # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    BOLD = "\033[1m"

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors."""
        # Add color to level name
        levelname = record.levelname
        if levelname in self.COLORS and sys.stderr.isatty():
            colored_levelname = f"{self.COLORS[levelname]}{self.BOLD}{levelname:8}{self.RESET}"
            record.levelname = colored_levelname

        # Format timestamp
        if self.usesTime():
            record.asctime = self.formatTime(record, self.datefmt)

        # Format the message
        formatted = super().format(record)

        # Reset levelname for subsequent formatters
        record.levelname = levelname

        return formatted


class StructuredFormatter(logging.Formatter):
    """Formatter that outputs structured JSON logs for production."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        import json
        from datetime import datetime

        log_data: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields if present
        if hasattr(record, "extra"):
            log_data["extra"] = record.extra

        return json.dumps(log_data)


def setup_logging() -> None:
    """Configure application logging."""
    # Create logs directory if it doesn't exist
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    # Determine log level
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Remove existing handlers
    root_logger.handlers.clear()

    # Console handler with colored output (development) or structured (production)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    if settings.DEBUG:
        # Development: colored console output
        console_format = (
            "%(levelname)s %(asctime)s [%(name)s] %(message)s (%(filename)s:%(lineno)d)"
        )
        console_formatter = ColoredFormatter(console_format, datefmt="%Y-%m-%d %H:%M:%S")
    else:
        # Production: structured JSON output
        console_formatter = StructuredFormatter()

    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)

    # File handler for all logs
    file_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "app.log",
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setLevel(logging.INFO)
    file_format = "%(asctime)s [%(levelname)s] %(name)s - %(message)s (%(filename)s:%(lineno)d)"
    file_handler.setFormatter(logging.Formatter(file_format))
    root_logger.addHandler(file_handler)

    # File handler for errors only
    error_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "error.log",
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(logging.Formatter(file_format))
    root_logger.addHandler(error_handler)

    # Silence noisy third-party loggers
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    # Set application logger level
    app_logger = logging.getLogger("app")
    app_logger.setLevel(log_level)

    # Log initial message
    app_logger.info(
        f"Logging configured - Level: {logging.getLevelName(log_level)}, "
        f"Mode: {'Development' if settings.DEBUG else 'Production'}"
    )


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for the given name.

    Args:
        name: Logger name, typically __name__ of the module

    Returns:
        Logger instance
    """
    return logging.getLogger(name)
