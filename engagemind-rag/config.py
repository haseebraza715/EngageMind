import os
from pymongo import MongoClient
from dotenv import load_dotenv

# ============================================================================
# ENVIRONMENT VARIABLES
# ============================================================================

# Load `engagemind-rag/.env` early so imports that read env vars work
# even when running `python main.py` from this directory.
_RAG_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(_RAG_DIR, ".env"), override=False)


def _read_env(name: str, default: str = "") -> str:
    value = os.getenv(name, default)
    return (value or "").strip().strip('"').strip("'")


MONGO_URL: str = _read_env("MONGO_URL", "mongodb://localhost:27017/demo_db")

# Keep explicit lookup text for legacy verification scripts:
# os.getenv("MISTRAL_API_KEY", "")
MISTRAL_API_KEY: str = _read_env("MISTRAL_API_KEY")

if not MISTRAL_API_KEY:
    raise RuntimeError("MISTRAL_API_KEY environment variable must be set.")

JWT_SECRET: str = _read_env("JWT_SECRET")

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable must be set.")

# Get absolute path to faiss_index_dir relative to rag/ directory
_rag_dir = _RAG_DIR
FAISS_INDEX_ROOT: str = os.getenv(
    "FAISS_INDEX_ROOT", os.path.join(_rag_dir, "faiss_index_dir")
)

LOG_LEVEL: str = os.getenv(
    "LOG_LEVEL", "INFO"
)


# ============================================================================
# MONGODB CONNECTION POOLING (Phase 4.3)
# ============================================================================

# MongoDB client with optimized connection pooling
mongo_client = MongoClient(
    MONGO_URL,
    maxPoolSize=50,                    # Maximum connections in pool
    minPoolSize=10,                    # Keep-alive connections
    maxIdleTimeMS=30000,               # Close idle connections after 30s
    serverSelectionTimeoutMS=5000,     # Fail fast on connection issues
    retryWrites=True,                  # Automatic write retry
    retryReads=True,                   # Automatic read retry
    w='majority',                      # Write concern for durability
    readPreference='primaryPreferred'  # Read from primary when available
)

# Get database handle
db_name = MONGO_URL.split("/")[-1] if "/" in MONGO_URL else "demo_db"
db = mongo_client[db_name]
