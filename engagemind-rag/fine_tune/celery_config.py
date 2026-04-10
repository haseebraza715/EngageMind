import os

from dotenv import load_dotenv
from celery import Celery


_FINE_TUNE_DIR = os.path.dirname(os.path.abspath(__file__))
_RAG_ROOT = os.path.dirname(_FINE_TUNE_DIR)
load_dotenv(os.path.join(_RAG_ROOT, ".env"), override=False)

redis_url = os.getenv("CELERY_REDIS_URL", "redis://localhost:6379/0")

# Configure Celery with Redis as broker and backend.
app = Celery(
    "engagemind_fine_tune",
    broker=redis_url,
    backend=redis_url,
    include=["fine_tune.tasks.tasks"],
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,
)
