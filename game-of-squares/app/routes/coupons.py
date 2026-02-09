"""Coupon retrieval/redemption."""

from flask import Blueprint, request, jsonify
from ..models import CouponModel

coupons_bp = Blueprint("coupons", __name__, url_prefix="/api/coupons")

COOKIE_NAME = "mg_uid"


@coupons_bp.route("/redeem", methods=["GET"])
def redeem():
    uid = request.cookies.get(COOKIE_NAME)
    if not uid:
        return jsonify({"error": "No user cookie."}), 401

    code = request.args.get("code")
    if code:
        coupon = CouponModel.find_by_code(code)
    else:
        coupon = CouponModel.find_latest_for_user(uid)

    if not coupon:
        return jsonify({"error": "No coupon found."}), 404

    return jsonify({
        "coupon_code": coupon["coupon_code"],
        "reward_pct": coupon["reward_pct"],
        "redeemed": coupon["redeemed"],
        "created_at": coupon["created_at"].isoformat(),
    })
