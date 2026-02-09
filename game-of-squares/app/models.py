"""Thin query wrappers over MongoDB collections."""

from datetime import datetime, timezone
from .db import get_db


class UserModel:
    @staticmethod
    def create(user_id):
        doc = {
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc),
            "squares_claimed": 0,
            "gardens_completed": 0,
            "total_plays": 0,
            "total_wins": 0,
            "last_attempt_at": None,
        }
        get_db().users.insert_one(doc)
        return doc

    @staticmethod
    def find(user_id):
        return get_db().users.find_one({"user_id": user_id}, {"_id": 0})

    @staticmethod
    def increment_play(user_id, won):
        update = {
            "$set": {"last_attempt_at": datetime.now(timezone.utc)},
            "$inc": {"total_plays": 1},
        }
        if won:
            update["$inc"]["total_wins"] = 1
            update["$inc"]["squares_claimed"] = 1
        return get_db().users.find_one_and_update(
            {"user_id": user_id}, update, return_document=True, projection={"_id": 0}
        )

    @staticmethod
    def complete_garden(user_id):
        return get_db().users.find_one_and_update(
            {"user_id": user_id},
            {"$set": {"squares_claimed": 0}, "$inc": {"gardens_completed": 1}},
            return_document=True,
            projection={"_id": 0},
        )

    @staticmethod
    def set_last_attempt(user_id, dt):
        get_db().users.update_one(
            {"user_id": user_id}, {"$set": {"last_attempt_at": dt}}
        )

    @staticmethod
    def reset_garden(user_id):
        get_db().users.update_one(
            {"user_id": user_id},
            {"$set": {"squares_claimed": 0, "gardens_completed": 0}},
        )


class PlayModel:
    @staticmethod
    def record(user_id, target_tile, selected_tile, won, reward_pct, coupon_code):
        doc = {
            "user_id": user_id,
            "played_at": datetime.now(timezone.utc),
            "target_tile": target_tile,
            "selected_tile": selected_tile,
            "won": won,
            "reward_pct": reward_pct,
            "coupon_code": coupon_code,
        }
        get_db().plays.insert_one(doc)
        return doc


class CouponModel:
    @staticmethod
    def create(user_id, coupon_code, reward_pct):
        doc = {
            "user_id": user_id,
            "coupon_code": coupon_code,
            "reward_pct": reward_pct,
            "created_at": datetime.now(timezone.utc),
            "redeemed": False,
            "redeemed_at": None,
        }
        get_db().coupons.insert_one(doc)
        return doc

    @staticmethod
    def find_by_code(coupon_code):
        return get_db().coupons.find_one(
            {"coupon_code": coupon_code}, {"_id": 0}
        )

    @staticmethod
    def find_latest_for_user(user_id):
        return get_db().coupons.find_one(
            {"user_id": user_id},
            {"_id": 0},
            sort=[("created_at", -1)],
        )

    @staticmethod
    def mark_redeemed(coupon_code):
        get_db().coupons.update_one(
            {"coupon_code": coupon_code},
            {"$set": {"redeemed": True, "redeemed_at": datetime.now(timezone.utc)}},
        )
