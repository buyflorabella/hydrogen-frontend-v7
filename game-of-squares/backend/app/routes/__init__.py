"""Blueprint registration."""

from .pages import pages_bp
from .users import users_bp
from .game_api import game_bp
from .coupons import coupons_bp


def register_routes(app):
    app.register_blueprint(pages_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(game_bp)
    app.register_blueprint(coupons_bp)

    if app.config["DEV_MODE"]:
        from .dev import dev_bp
        app.register_blueprint(dev_bp)
