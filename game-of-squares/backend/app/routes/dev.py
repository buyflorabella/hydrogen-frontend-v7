"""Dev-only routes — cooldown bypass, state reset, forced outcomes."""

from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify, session
from ..models import UserModel

dev_bp = Blueprint("dev", __name__, url_prefix="/api/dev")

COOKIE_NAME = "mg_uid"


def _get_uid():
    uid = request.cookies.get(COOKIE_NAME)
    if not uid:
        return None, (jsonify({"error": "No user cookie."}), 401)
    return uid, None


@dev_bp.route("/reset-cooldown", methods=["POST"])
def reset_cooldown():
    uid, err = _get_uid()
    if err:
        return err
    UserModel.set_last_attempt(uid, None)
    return jsonify({"ok": True, "action": "cooldown_cleared"})


@dev_bp.route("/set-cooldown", methods=["POST"])
def set_cooldown():
    uid, err = _get_uid()
    if err:
        return err
    seconds = int(request.args.get("seconds", "10"))
    # Set last_attempt_at so cooldown expires in `seconds` from now
    from flask import current_app
    cooldown = current_app.config["COOLDOWN_SECONDS"]
    fake_last = datetime.now(timezone.utc) - timedelta(seconds=cooldown - seconds)
    UserModel.set_last_attempt(uid, fake_last)
    return jsonify({"ok": True, "action": "cooldown_set", "expires_in_seconds": seconds})


@dev_bp.route("/reset-garden", methods=["POST"])
def reset_garden():
    uid, err = _get_uid()
    if err:
        return err
    UserModel.reset_garden(uid)
    return jsonify({"ok": True, "action": "garden_reset"})


@dev_bp.route("/force-win", methods=["POST"])
def force_win():
    session["force_outcome"] = "win"
    return jsonify({"ok": True, "action": "next_play_will_win"})


@dev_bp.route("/force-loss", methods=["POST"])
def force_loss():
    session["force_outcome"] = "loss"
    return jsonify({"ok": True, "action": "next_play_will_lose"})


@dev_bp.route("/user-state", methods=["GET"])
def user_state():
    uid, err = _get_uid()
    if err:
        return err
    user = UserModel.find(uid)
    if not user:
        return jsonify({"error": "User not found."}), 404
    # Serialize datetime fields
    for key in ("created_at", "last_attempt_at"):
        if user.get(key):
            user[key] = user[key].isoformat()
    return jsonify(user)
