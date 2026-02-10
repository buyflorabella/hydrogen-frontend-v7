"""User identity — cookie-based, no login required."""

import uuid
from flask import Blueprint, request, jsonify, make_response
from ..models import UserModel

users_bp = Blueprint("users", __name__, url_prefix="/api/users")

COOKIE_NAME = "mg_uid"
COOKIE_MAX_AGE = 365 * 24 * 60 * 60  # 1 year


@users_bp.route("/create", methods=["POST"])
def create_user():
    existing_uid = request.cookies.get(COOKIE_NAME)
    if existing_uid:
        user = UserModel.find(existing_uid)
        if user:
            return jsonify({
                "user_id": user["user_id"],
                "created": False,
                "squares_claimed": user["squares_claimed"],
                "gardens_completed": user["gardens_completed"],
            })

    user_id = uuid.uuid4().hex
    user = UserModel.create(user_id)
    resp = make_response(jsonify({
        "user_id": user_id,
        "created": True,
        "squares_claimed": 0,
        "gardens_completed": 0,
    }))
    resp.set_cookie(
        COOKIE_NAME,
        user_id,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite="Lax",
    )
    return resp
