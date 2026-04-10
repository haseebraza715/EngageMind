import os

from rag.server.app import create_app as _create_server_app


def create_app():
    """
    Entry point used by local development.

    The actual Flask wiring (CORS, Mongo indexes, routes, conversation graph)
    lives in `rag/server/app.py`. This wrapper keeps `python main.py`
    working as documented.
    """

    return _create_server_app()


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5001"))
    debug = os.getenv("DEBUG", "true").lower() == "true"

    app = create_app()
    app.run(host=host, port=port, debug=debug)
