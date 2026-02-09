# Memory Garden — Activity Log

## 2026-02-09 — V1 MVP Initial Build

### Completed
- Flask app skeleton with factory pattern (`app/__init__.py`, `config.py`)
- MongoDB integration (`db.py`) with indexes on users, plays, coupons
- Cookie-based user identity (`mg_uid` HttpOnly, SameSite=Lax, 1yr)
- Thin model layer (`models.py`): UserModel, PlayModel, CouponModel
- Pure game logic (`game.py`): tile generation from Picsum pool, weighted rewards, cooldown check
- API routes: `/api/users/create`, `/api/game/status`, `/api/game/play`, `/api/coupons/redeem`
- Dev routes (conditional): reset-cooldown, set-cooldown, reset-garden, force-win/loss, user-state
- Full game UI: 4x3 tile grid with CSS 3D flip, target prompt, tile selection
- Reward roller animation (CSS vertical strip, cubic-bezier deceleration)
- Coupon display after win
- Garden progress grid (6x2, fill animation, completion detection)
- Cooldown countdown timer (HH:MM:SS, auto-refresh on expiry)
- Loss state: "So close." + brief correct-tile reveal with green border
- Dev panel (collapsible, conditional on GARDEN_DEV_MODE)
- Premium placeholder ("Coming Soon" locked element)
- Mobile-responsive (360px+ viewport)
- All config via env vars with sensible defaults
