import logging
import sys
from pathlib import Path


def setup_logger(name: str = "se_handwerk", log_file: str = "se_handwerk.log") -> logging.Logger:
    """Konfiguriert Logger mit Konsolen- und Datei-Output."""
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    logger.setLevel(logging.DEBUG)

    formatter = logging.Formatter(
        "%(asctime)s | %(name)-20s | %(levelname)-8s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Konsole: INFO+ (UTF-8 für Windows)
    stream = open(sys.stdout.fileno(), mode='w', encoding='utf-8', closefd=False)
    console = logging.StreamHandler(stream)
    console.setLevel(logging.INFO)
    console.setFormatter(formatter)
    logger.addHandler(console)

    # Datei: DEBUG+
    log_path = Path(__file__).resolve().parent.parent / log_file
    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger
