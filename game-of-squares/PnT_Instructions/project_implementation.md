# project_design.md

**Project Name:** Memory Garden  
**Description:** A micro-engagement memory game designed to increase repeat store visits and conversions through skill-based rewards and habit-forming mechanics.  
**Current Phase:** MVP (V1) Design → Development Ready  

**Tech Stack (Recommended):**
- Language: Python or TypeScript (team preference)
- Framework: FastAPI / Flask OR Node + Express
- Database: MongoDB
- Frontend: React (preferred) or lightweight JS
- Image Provider: Picsum (temporary randomized imagery)
- Infrastructure: Containerized (Docker recommended but optional for MVP)

---

# Executive Product Summary

Memory Garden is a **3-second skill-based memory game** embedded into an eCommerce experience.

The system is NOT positioned as a game internally — it is a **retention engine disguised as a game.**

Primary behavioral loop:

1. User plays a fast memory challenge  
2. User earns a coupon  
3. User returns tomorrow for another attempt  
4. User accumulates completed gardens (visible progress)  

Future expansion includes referral-driven acquisition and premium attempt mechanics.

---

# Product Pillars (LOCKED)

## Pillar 1 — Speed
Display prominently:

> **“Test your memory. Takes 3 seconds.”**

Reduce perceived effort → increase participation.

---

## Pillar 2 — Skill-Based Outcome
Winning is determined ONLY by memory accuracy.

**No random win mechanics.**

Randomness exists ONLY in reward tier after success.

This preserves perceived fairness and increases emotional ownership.

---

## Pillar 3 — Habit Formation
Users receive:

> **1 attempt every rolling 24 hours**

NOT midnight reset.

Rolling timers prevent infrastructure spikes and reinforce anticipation.

For Developer testing - build in a mechanism to TEST and enable/disable this feature for testing.  very important is developer testing.  Test this that it works, in a fashion simulating a real world test, if possible, without actually delaying program code, if possible.  if not possible, provide a method to test.

---

## Pillar 4 — Visible Progress
Users accumulate completed boards inside:

> **“Your Memory Garden”**

This creates ownership psychology and increases retention probability.

---

# VERSION STRATEGY

---

# V1 — MVP (Build This First)

## Objective
Launch quickly with the smallest viable retention loop.

Avoid feature creep.

Validate one question:

> **Will users return to play again?**

---

## Core Features

### ✅ Memory Game
Flow:

1. Reveal 12 tiles for **2 seconds**
2. Hide tiles
3. Prompt target image (example: carrot, rose, tomato)
4. User selects tile

**Win:** correct tile  
**Loss:** reveal correct tile briefly + “So close.”

Never shame the player.

---

### ✅ Coupon Reward Animation (LOCKED)

After a win:

Run a **700–1200ms rolling animation**:

1% → 3% → 2% → 1% → STOP


Reward must be **pre-calculated server-side.**

Frontend animation is cosmetic only.

NEVER calculate rewards in-browser.

---

### ✅ Coupon System

Reward tiers:

- 1%
- 2%
- 3%

Use weighted probability (recommended starting curve):

- 70% → 1%
- 25% → 2%
- 5% → 3%

These values should be configurable.

Return a coupon code immediately after win.

---

### ✅ Square Claiming
Each successful play claims one square.

Squares represent completed memory challenges.

After 12 claimed squares:

> Garden Complete.

---

### ✅ Completed Garden Stack
Completed gardens move into a side archive showing:

> “Gardens Completed: X”

This creates visible participation history.

Extremely important psychologically.

---

### ✅ Rolling Attempt Cooldown

Database field:

last_attempt_at (timestamp)


Logic:


if now - last_attempt_at >= 86400:
allow_play
else:
deny_play


Return remaining seconds for countdown display.

---

### ✅ Random Gardening Imagery

Use Picsum temporarily.

Search themes:

- vegetables  
- flowers  
- farms  
- plants  
- herbs  

This is placeholder imagery until brand assets exist.

Do NOT over-invest in art for MVP.

Behavior > aesthetics.

---

### ✅ Identity Strategy (Lean)

Layered identity:

1. Cookie (primary)
2. Email capture AFTER reward (optional)
3. Account link (future)

Do NOT require login to play.

Friction kills velocity.

---

# UI Copy (LOCK THESE)

**Entry CTA:**
> Test your memory. Takes 3 seconds.

**Loss Message:**
> So close.

**Cooldown:**
> New board available in 18:42:11

**Completion:**
> Garden Complete 🌱

---

# V1 Architecture (Lean)

## Suggested Endpoints



POST /users/create
GET /game/status
POST /game/play
GET /coupons/redeem



Keep the system boring.

Boring scales.

Do NOT microservice this.

---

# Data Models (Suggested)

## Users


user_id
created_at
last_attempt_at
attempts_remaining (default: 1)
gardens_completed
referral_code (future-safe)
referred_by (nullable)


## Plays

play_id
user_id
target_tile
selected_tile
result
reward_percentage
timestamp


## Coupons


coupon_id
user_id
percentage
redeemed (bool)
created_at


---

# V1 — Incentive Placeholder (HYPE MECHANIC)

We are intentionally NOT launching premium incentives yet.

However — we want users aware something bigger is coming.

Display locked UI element:

> 🔒 **Premium Attempts — Coming Soon**  
> Watch a short video to earn extra plays.

This seeds future behavior early.

Users become primed for the mechanic before it exists.

Extremely valuable psychologically.

---

# V2 — Premium Attempts via Video (Planned)

## Goal
Introduce attempts as a premium currency without harming brand perception.

### Mechanic:
> Watch a short sponsor message → earn 1 extra attempt.

IMPORTANT:
Limit to **1–2 per day.**

Do NOT allow infinite farming.

---

## Ad Infrastructure Strategy

Since Revive Adserver is available:

Recommended flow:

1. Client requests ad.
2. Ad impression fires.
3. Completion callback hits backend.
4. Backend grants attempt.

### Abuse Protection:
Require minimum watch duration before reward.

Example:

> Must watch ≥ 80% of video.

Track:

ad_watch_id
user_id
completion_percent
timestamp


---

# V3 — Referral Engine (Acquisition Layer)

## Objective
Turn players into growth drivers.

Reward behavior — not purchases.

---

## Mechanic

Each user receives:

referral_code = base36_random(6–8 chars)


Example:

HG7K2P


Referral URL:

/play?ref=HG7K2P


---

## Reward Structure

When a new valid user signs up:

✅ Referrer gets +1 attempt  
✅ New user gets +1 attempt  

Instant reward.

No delays.

Immediate reinforcement strengthens sharing.

---

## Referral Validation Rules

Check:

- Code exists  
- User is new  
- Not self-referral  
- Not duplicate device/IP  
- Not already rewarded  

Block obvious fraud only.

Do NOT build a surveillance state.

Most abuse is lazy.

---

# Abuse Prevention (LIGHT BUT EARLY)

Track minimum:

- IP hash  
- cookie  
- user agent  

Flag suspicious bursts.

Soft-block.

Move on.

Do not over-engineer.

---

# Difficulty Target

Aim for:

> **60–75% win rate**

Adjust via:

- tile similarity  
- reveal duration  
- tile count  

Never drop below 50%.

Frustration kills retention.

---

# What We Are NOT Building Yet

To protect MVP velocity:

❌ leaderboards  
❌ multiplayer  
❌ tournaments  
❌ social feeds  
❌ complex economies  

Discipline wins launches.

---

# Three-Step Implementation Plan

## Step 1 — MVP Foundation
Build:

- user creation  
- attempt cooldown  
- memory board  
- reward system  
- coupon issuance  
- garden completion archive  

Ship fast.

Learn fast.

---

## Step 2 — Premium Currency
Add:

- video ad reward
- attempt grants
- daily cap
- abuse checks

Attempts become the true engagement lever.

---

## Step 3 — Referral Engine
Deploy acquisition loop:

- referral codes
- validation logic
- attempt rewards
- fraud resistance

Now the product grows itself.

---

# Developer Operational Instructions

All implementation guidance exists in:

> **/PnT_instructions**

Developer must create:

### Required Files
activity_log.md → chronological work log
status.md → latest project state only
project_design.md → (this document expanded with technical decisions)


`status.md` must remain concise.

Think executive snapshot — not diary.

---

# Developer End Goal

Produce an expanded **project_design.md** containing:

- technical architecture decisions  
- schema confirmations  
- endpoint definitions  
- deployment approach  
- risk areas  
- scaling considerations  

This document becomes the execution blueprint.

---

# Final Strategic Note (Important)

Do not treat this like a novelty widget.

You are building something merchants deeply lack:

> **A voluntary return mechanic.**

Returning users are dramatically more valuable than new traffic.

Protect the simplicity.

Launch before you feel ready.

Learn from behavior — not speculation.

---

**Status:** DESIGN LOCKED — READY FOR DEVELOPMENT
**Priority:** HIGH  
**Risk Level:** LOW (if scope discipline is maintained)





