"""Pure game logic: tiles, rewards, cooldown."""

import random
import string
from datetime import datetime, timezone

# Curated Picsum nature/landscape image IDs
PICSUM_POOL = [
    10, 11, 15, 16, 17, 18, 19, 20, 22, 24,
    27, 28, 29, 36, 37, 39, 40, 42, 43, 47,
    48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
    58, 59, 60, 62, 63, 64, 65, 66, 67, 68,
    69, 70, 71, 73, 74,
]


def generate_tile_set(tile_count=12):
    """Pick `tile_count` random Picsum IDs for the board."""
    ids = random.sample(PICSUM_POOL, tile_count)
    return [{"id": pid, "url": f"https://picsum.photos/id/{pid}/200/200"} for pid in ids]


def pick_target(tiles):
    """Choose one tile as the memorization target."""
    return random.choice(tiles)


def check_cooldown(last_attempt_at, cooldown_seconds):
    """Return (can_play, remaining_seconds)."""
    if last_attempt_at is None:
        return True, 0
    # pymongo returns naive datetimes (UTC without tzinfo)
    if last_attempt_at.tzinfo is None:
        last_attempt_at = last_attempt_at.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    elapsed = (now - last_attempt_at).total_seconds()
    remaining = cooldown_seconds - elapsed
    if remaining <= 0:
        return True, 0
    return False, int(remaining)


def calculate_reward(reward_weights):
    """Weighted random reward percentage. Returns 1, 2, or 3."""
    percentages = list(reward_weights.keys())
    weights = list(reward_weights.values())
    return random.choices(percentages, weights=weights, k=1)[0]


def generate_coupon_code(prefix="MG"):
    """Generate a unique-ish coupon code like MG-A3X7K2."""
    chars = string.ascii_uppercase + string.digits
    suffix = "".join(random.choices(chars, k=6))
    return f"{prefix}-{suffix}"
