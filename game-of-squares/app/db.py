"""MongoDB connection + indexes."""

from pymongo import MongoClient, ASCENDING

_client = None
_db = None


def init_db(app):
    global _client, _db
    _client = MongoClient(app.config["MONGO_URI"])
    _db = _client[app.config["MONGO_DB"]]
    _ensure_indexes()


def get_db():
    return _db


def _ensure_indexes():
    _db.users.create_index([("user_id", ASCENDING)], unique=True)
    _db.plays.create_index([("user_id", ASCENDING), ("played_at", ASCENDING)])
    _db.coupons.create_index([("coupon_code", ASCENDING)], unique=True)
    _db.coupons.create_index([("user_id", ASCENDING)])
