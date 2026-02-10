"""Configuration — all env-var-driven."""

import os


def load_config(app):
    app.config["PORT"] = int(os.environ.get("GARDEN_PORT", "15002"))
    app.config["MONGO_URI"] = os.environ.get("GARDEN_MONGO_URI", "mongodb://127.0.0.1:27028")
    app.config["MONGO_DB"] = os.environ.get("GARDEN_MONGO_DB", "memory_garden")
    app.config["COOLDOWN_SECONDS"] = int(os.environ.get("GARDEN_COOLDOWN_SECONDS", "86400"))
    app.config["REVEAL_MS"] = int(os.environ.get("GARDEN_REVEAL_MS", "2000"))
    app.config["TILE_COUNT"] = int(os.environ.get("GARDEN_TILE_COUNT", "12"))
    app.config["SQUARES_PER_GARDEN"] = int(os.environ.get("GARDEN_SQUARES_PER_GARDEN", "12"))
    app.config["REWARD_WEIGHTS"] = {
        1: int(os.environ.get("GARDEN_REWARD_1_WEIGHT", "70")),
        2: int(os.environ.get("GARDEN_REWARD_2_WEIGHT", "25")),
        3: int(os.environ.get("GARDEN_REWARD_3_WEIGHT", "5")),
    }
    app.config["DEV_MODE"] = os.environ.get("GARDEN_DEV_MODE", "false").lower() == "true"
    app.secret_key = os.environ.get("GARDEN_SECRET_KEY", "memory-garden-dev-key-change-me")
