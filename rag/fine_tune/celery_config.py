from celery import Celery

# Configure Celery with Redis as broker and backend
app = Celery(
    'rag_app',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# Celery configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    result_expires=3600,  # Results expire after 1 hour
)

# Auto-discover tasks in the 'rag.fine_tune.tasks' module
app.autodiscover_tasks(['rag.fine_tune.tasks.tasks'])