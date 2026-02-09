/**
 * Memory Garden — Game State Machine
 *
 * States: INIT → LOADING → REVEAL → MEMORIZE → PROMPT → SELECT → RESULT
 */

(function () {
    "use strict";

    const CFG = window.GAME_CONFIG;

    // DOM refs
    const $ = (sel) => document.querySelector(sel);
    const board = $("#gameBoard");
    const playBtn = $("#playBtn");
    const spinner = $("#loadingSpinner");
    const cooldownSection = $("#cooldownSection");
    const cooldownTimer = $("#cooldownTimer");
    const targetPrompt = $("#targetPrompt");
    const targetImage = $("#targetImage");
    const resultOverlay = $("#resultOverlay");
    const resultMessage = $("#resultMessage");
    const rewardRoller = $("#rewardRoller");
    const rollerStrip = $("#rollerStrip");
    const rewardFinal = $("#rewardFinal");
    const couponDisplay = $("#couponDisplay");
    const couponCode = $("#couponCode");
    const couponPct = $("#couponPct");
    const gardenComplete = $("#gardenComplete");
    const resultDismiss = $("#resultDismiss");
    const gardenGrid = $("#gardenGrid");
    const gardensCompleted = $("#gardensCompleted");

    let state = "INIT";
    let gameData = null; // response from /api/game/status
    let cooldownInterval = null;

    // ─── API helpers ───

    async function api(path, opts = {}) {
        const resp = await fetch(path, {
            headers: { "Content-Type": "application/json" },
            ...opts,
        });
        return resp.json();
    }

    async function ensureUser() {
        return api("/api/users/create", { method: "POST" });
    }

    async function fetchStatus() {
        return api("/api/game/status");
    }

    async function submitPlay(selectedTileId) {
        return api("/api/game/play", {
            method: "POST",
            body: JSON.stringify({ selected_tile_id: selectedTileId }),
        });
    }

    // ─── Image preloader ───

    function preloadImages(tiles) {
        return Promise.all(
            tiles.map(
                (t) =>
                    new Promise((resolve) => {
                        const img = new Image();
                        img.onload = resolve;
                        img.onerror = resolve; // don't block on failure
                        img.src = t.url;
                    })
            )
        );
    }

    // ─── Garden UI ───

    function updateGarden(squaresClaimed, gardensCompletedCount) {
        const squares = gardenGrid.querySelectorAll(".garden-square");
        squares.forEach((sq, i) => {
            sq.classList.toggle("filled", i < squaresClaimed);
        });
        gardensCompleted.textContent = `Gardens Completed: ${gardensCompletedCount}`;
    }

    function animateGardenSquare(index) {
        const sq = gardenGrid.querySelectorAll(".garden-square")[index];
        if (sq) {
            sq.classList.add("filled", "just-filled");
            sq.addEventListener("animationend", () => sq.classList.remove("just-filled"), { once: true });
        }
    }

    // ─── Cooldown ───

    function startCooldown(remainingSeconds) {
        setState("COOLDOWN");
        cooldownSection.classList.remove("hidden");
        playBtn.classList.add("hidden");
        board.innerHTML = "";
        targetPrompt.classList.add("hidden");

        let remaining = remainingSeconds;
        updateCooldownDisplay(remaining);

        clearInterval(cooldownInterval);
        cooldownInterval = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(cooldownInterval);
                cooldownSection.classList.add("hidden");
                init(); // re-fetch status
            } else {
                updateCooldownDisplay(remaining);
            }
        }, 1000);
    }

    function updateCooldownDisplay(seconds) {
        const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
        const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
        const s = String(seconds % 60).padStart(2, "0");
        cooldownTimer.textContent = `${h}:${m}:${s}`;
    }

    // ─── Board rendering ───

    function renderBoard(tiles, faceUp) {
        board.innerHTML = "";
        tiles.forEach((tile) => {
            const el = document.createElement("div");
            el.className = "tile" + (faceUp ? "" : " flipped");
            el.dataset.tileId = tile.id;
            el.innerHTML = `
                <div class="tile-inner">
                    <div class="tile-face"><img src="${tile.url}" alt="tile"></div>
                    <div class="tile-back"></div>
                </div>
            `;
            board.appendChild(el);
        });
    }

    function flipAllDown() {
        board.querySelectorAll(".tile").forEach((t) => t.classList.add("flipped"));
    }

    function flipTileUp(tileId) {
        const tile = board.querySelector(`.tile[data-tile-id="${tileId}"]`);
        if (tile) tile.classList.remove("flipped");
        return tile;
    }

    function enableSelection() {
        board.querySelectorAll(".tile").forEach((t) => {
            t.classList.add("selectable");
            t.addEventListener("click", onTileSelect, { once: true });
        });
    }

    function disableSelection() {
        board.querySelectorAll(".tile").forEach((t) => {
            t.classList.remove("selectable");
        });
    }

    // ─── Tile selection handler ───

    async function onTileSelect(e) {
        const tile = e.currentTarget;
        const selectedId = Number(tile.dataset.tileId);

        disableSelection();
        tile.classList.add("selected");

        // Flip the selected tile face-up
        tile.classList.remove("flipped");

        setState("RESULT");
        const result = await submitPlay(selectedId);
        handleResult(result, selectedId);
    }

    // ─── Result handling ───

    function handleResult(result, selectedId) {
        resultOverlay.classList.remove("hidden");
        rewardRoller.classList.add("hidden");
        couponDisplay.classList.add("hidden");
        gardenComplete.classList.add("hidden");

        if (result.result === "win") {
            resultMessage.textContent = "Correct!";
            resultMessage.className = "result-message win";

            // Animate reward roller then show coupon
            playRewardRoller(result.reward_percentage, () => {
                couponCode.textContent = result.coupon_code;
                couponPct.textContent = `${result.reward_percentage}% off your next order`;
                couponDisplay.classList.remove("hidden");

                if (result.garden_just_completed) {
                    gardenComplete.classList.remove("hidden");
                    // Reset garden visually then show completed count
                    setTimeout(() => {
                        updateGarden(0, result.gardens_completed);
                    }, 1500);
                } else {
                    // Animate the new square
                    animateGardenSquare(result.squares_claimed - 1);
                }

                updateGarden(
                    result.garden_just_completed ? result.squares_per_garden : result.squares_claimed,
                    result.garden_just_completed ? result.gardens_completed - 1 : result.gardens_completed
                );
            });
        } else {
            resultMessage.textContent = "So close.";
            resultMessage.className = "result-message loss";

            // Briefly reveal correct tile
            const correctTile = flipTileUp(result.correct_tile_id);
            if (correctTile) correctTile.classList.add("correct-reveal");

            // Mark selected as wrong if different
            if (selectedId !== result.correct_tile_id) {
                const selectedTile = board.querySelector(`.tile[data-tile-id="${selectedId}"]`);
                if (selectedTile) selectedTile.classList.add("wrong-reveal");
            }

            updateGarden(result.squares_claimed, result.gardens_completed);
        }
    }

    // ─── Reward Roller Animation ───

    function playRewardRoller(finalPct, onDone) {
        rewardRoller.classList.remove("hidden");
        rewardFinal.textContent = "";

        // Build strip: several random values then land on final
        const values = [1, 2, 3, 1, 2, 3, 2, 1, 3, 2, 1, 3];
        // Ensure final value is at the end
        values.push(finalPct);

        rollerStrip.innerHTML = "";
        values.forEach((v) => {
            const item = document.createElement("div");
            item.className = "roller-item";
            item.textContent = `${v}%`;
            rollerStrip.appendChild(item);
        });

        const itemHeight = 60;
        const totalOffset = (values.length - 1) * itemHeight;
        const duration = 800 + Math.random() * 400; // 800-1200ms

        // Reset position
        rollerStrip.style.transition = "none";
        rollerStrip.style.transform = "translateY(0)";

        // Force reflow
        rollerStrip.offsetHeight;

        // Animate
        rollerStrip.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        rollerStrip.style.transform = `translateY(-${totalOffset}px)`;

        setTimeout(() => {
            rewardFinal.textContent = `You won ${finalPct}% off!`;
            if (onDone) onDone();
        }, duration + 200);
    }

    // ─── State machine ───

    function setState(s) {
        state = s;
    }

    async function init() {
        setState("INIT");
        board.innerHTML = "";
        targetPrompt.classList.add("hidden");
        resultOverlay.classList.add("hidden");
        cooldownSection.classList.add("hidden");
        playBtn.classList.add("hidden");

        const user = await ensureUser();
        updateGarden(user.squares_claimed, user.gardens_completed);

        const status = await fetchStatus();

        if (!status.can_play) {
            startCooldown(status.remaining_seconds);
            updateGarden(status.squares_claimed, status.gardens_completed);
            return;
        }

        gameData = status;
        updateGarden(status.squares_claimed, status.gardens_completed);

        // Show play button
        playBtn.classList.remove("hidden");
        playBtn.textContent = "Play";
    }

    async function startGame() {
        playBtn.classList.add("hidden");
        setState("LOADING");
        spinner.classList.remove("hidden");

        // Preload images
        await preloadImages(gameData.tiles);
        spinner.classList.add("hidden");

        // REVEAL: show all tiles face-up
        setState("REVEAL");
        renderBoard(gameData.tiles, true);

        // MEMORIZE: after reveal_ms, flip all down
        setTimeout(() => {
            setState("MEMORIZE");
            flipAllDown();

            // PROMPT: show target
            setTimeout(() => {
                setState("PROMPT");
                targetImage.src = gameData.target.url;
                targetPrompt.classList.remove("hidden");

                // SELECT: enable tile clicking
                setState("SELECT");
                enableSelection();
            }, 400); // brief pause after flip
        }, gameData.reveal_ms);
    }

    // ─── Event bindings ───

    playBtn.addEventListener("click", startGame);

    resultDismiss.addEventListener("click", () => {
        resultOverlay.classList.add("hidden");
        init(); // re-fetch status (will show cooldown)
    });

    // ─── Dev panel (global functions for onclick) ───

    window.devAction = async function (action) {
        const out = $("#devOutput");
        try {
            const resp = await fetch(`/api/dev/${action}`, { method: "POST" });
            const data = await resp.json();
            out.textContent = JSON.stringify(data, null, 2);
            // Re-init after dev action
            init();
        } catch (e) {
            out.textContent = `Error: ${e.message}`;
        }
    };

    window.devRevealTiles = function () {
        const out = $("#devOutput");
        const tiles = board.querySelectorAll(".tile.flipped");
        if (!tiles.length) {
            out.textContent = "No hidden tiles to reveal.";
            return;
        }
        // Flip all face-up for 1.5s, then back down
        tiles.forEach((t) => t.classList.remove("flipped"));
        out.textContent = "Tiles revealed for 1.5s...";
        setTimeout(() => {
            board.querySelectorAll(".tile").forEach((t) => {
                if (t.classList.contains("selectable")) t.classList.add("flipped");
            });
            out.textContent = "Tiles hidden again.";
        }, 1500);
    };

    window.devShowState = async function () {
        const out = $("#devOutput");
        try {
            const resp = await fetch("/api/dev/user-state");
            const data = await resp.json();
            out.textContent = JSON.stringify(data, null, 2);
        } catch (e) {
            out.textContent = `Error: ${e.message}`;
        }
    };

    // ─── Boot ───

    init();
})();
