"""Game API — status + play endpoints."""

from flask import Blueprint, request, session, jsonify, current_app
from ..models import UserModel, PlayModel, CouponModel
from ..game import (
    generate_tile_set,
    pick_target,
    check_cooldown,
    calculate_reward,
    generate_coupon_code,
)

game_bp = Blueprint("game", __name__, url_prefix="/api/game")

COOKIE_NAME = "mg_uid"


def _get_user_or_error():
    uid = request.cookies.get(COOKIE_NAME)
    if not uid:
        return None, (jsonify({"error": "No user cookie. Call /api/users/create first."}), 401)
    user = UserModel.find(uid)
    if not user:
        return None, (jsonify({"error": "User not found."}), 404)
    return user, None


@game_bp.route("/status", methods=["GET"])
def status():
    user, err = _get_user_or_error()
    if err:
        return err

    cooldown_sec = current_app.config["COOLDOWN_SECONDS"]
    can_play, remaining = check_cooldown(user["last_attempt_at"], cooldown_sec)

    # Check for force_win/force_loss in session (dev feature)
    force_outcome = session.pop("force_outcome", None)

    if not can_play:
        return jsonify({
            "can_play": False,
            "remaining_seconds": remaining,
            "squares_claimed": user["squares_claimed"],
            "squares_per_garden": current_app.config["SQUARES_PER_GARDEN"],
            "gardens_completed": user["gardens_completed"],
        })

    tile_count = current_app.config["TILE_COUNT"]
    tiles = generate_tile_set(tile_count)
    target = pick_target(tiles)

    # Store in session for server-side validation on play
    session["game_tiles"] = [t["id"] for t in tiles]
    session["game_target"] = target["id"]
    if force_outcome:
        session["force_outcome"] = force_outcome

    return jsonify({
        "can_play": True,
        "remaining_seconds": 0,
        "tiles": tiles,
        "target": target,
        "reveal_ms": current_app.config["REVEAL_MS"],
        "squares_claimed": user["squares_claimed"],
        "squares_per_garden": current_app.config["SQUARES_PER_GARDEN"],
        "gardens_completed": user["gardens_completed"],
    })


@game_bp.route("/play", methods=["POST"])
def play():
    user, err = _get_user_or_error()
    if err:
        return err

    data = request.get_json(silent=True) or {}
    selected_id = data.get("selected_tile_id")
    if selected_id is None:
        return jsonify({"error": "Missing selected_tile_id"}), 400

    game_target = session.get("game_target")
    game_tiles = session.get("game_tiles")
    if game_target is None or game_tiles is None:
        return jsonify({"error": "No active game. Call /api/game/status first."}), 400

    if selected_id not in game_tiles:
        return jsonify({"error": "Invalid tile ID."}), 400

    # Check for forced outcome (dev feature)
    force_outcome = session.pop("force_outcome", None)

    if force_outcome == "win":
        won = True
    elif force_outcome == "loss":
        won = False
    else:
        won = (selected_id == game_target)

    # Clear game state from session
    session.pop("game_target", None)
    session.pop("game_tiles", None)

    reward_pct = 0
    coupon_code = None
    garden_just_completed = False

    if won:
        reward_pct = calculate_reward(current_app.config["REWARD_WEIGHTS"])
        coupon_code = generate_coupon_code()
        CouponModel.create(user["user_id"], coupon_code, reward_pct)

    updated_user = UserModel.increment_play(user["user_id"], won)

    if won and updated_user["squares_claimed"] >= current_app.config["SQUARES_PER_GARDEN"]:
        updated_user = UserModel.complete_garden(user["user_id"])
        garden_just_completed = True

    PlayModel.record(
        user["user_id"], game_target, selected_id, won, reward_pct, coupon_code
    )

    response = {
        "result": "win" if won else "loss",
        "correct_tile_id": game_target,
        "reward_percentage": reward_pct,
        "coupon_code": coupon_code,
        "squares_claimed": updated_user["squares_claimed"],
        "squares_per_garden": current_app.config["SQUARES_PER_GARDEN"],
        "gardens_completed": updated_user["gardens_completed"],
        "garden_just_completed": garden_just_completed,
    }
    return jsonify(response)
