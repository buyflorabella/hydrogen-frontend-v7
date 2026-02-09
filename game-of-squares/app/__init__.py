"""Memory Garden — App factory."""

from flask import Flask
from .config import load_config
from .db import init_db
from .routes import register_routes


def create_app():
    app = Flask(__name__)
    load_config(app)
    init_db(app)
    register_routes(app)
    return app
