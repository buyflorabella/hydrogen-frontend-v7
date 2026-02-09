# Memory Garden — Status

**Version:** V1 MVP
**Status:** Development Complete — Ready for Testing
**Date:** 2026-02-09

## What's Built
- Full game loop: create user → view board → memorize → select → win/loss → reward → cooldown
- Flask monolith on port 15002, MongoDB at 27028
- Cookie identity (no login), game state in Flask session
- Weighted coupon rewards (1%/2%/3%), garden progress tracking
- Dev testing panel with cooldown bypass and forced outcomes

## How to Run
```bash
cd game-of-squares
GARDEN_DEV_MODE=true python3 run.py
```
Open `http://localhost:15002`

## What's Next
- User acceptance testing
- Shopify coupon integration (connect codes to actual discounts)
- V2: Premium attempts via video ads
- V3: Referral engine
