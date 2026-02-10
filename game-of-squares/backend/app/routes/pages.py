"""Page routes — serves the game UI."""

from flask import Blueprint, render_template, current_app

pages_bp = Blueprint("pages", __name__)


@pages_bp.route("/")
def index():
    return render_template(
        "game.html",
        reveal_ms=current_app.config["REVEAL_MS"],
        tile_count=current_app.config["TILE_COUNT"],
        dev_mode=current_app.config["DEV_MODE"],
    )
