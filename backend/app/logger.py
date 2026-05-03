import logging
import sys
from app.config import settings

# Configurar formato de logging
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# Crear logger principal
logger = logging.getLogger(settings.app_name)
logger.setLevel(logging.DEBUG if settings.environment == "development" else logging.INFO)

# Handler de consola
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))

# Añadir handler si no existe (evita handlers duplicados en recargas)
if not logger.handlers:
    logger.addHandler(console_handler)
