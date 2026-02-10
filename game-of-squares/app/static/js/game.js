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

    // New DOM refs
    const teaserSection = $("#teaserSection");
    const howToPlayBtn = $("#howToPlayBtn");
    const instructionsModal = $("#instructionsModal");
    const modalClose = $("#modalClose");
    const replayTourLink = $("#replayTourLink");
    const walkthroughOverlay = $("#walkthroughOverlay");
    const walkthroughCard = $("#walkthroughCard");
    const continuousPlayBox = $("#continuousPlay"); // may be null if !dev_mode
    const revealCountdown = $("#revealCountdown");
    const revealTimerEl = $("#revealTimer");
    const sidePanel = $("#sidePanel");
    const sidePanelTab = $("#sidePanelTab");

    let state = "INIT";
    let gameData = null; // response from /api/game/status
    let cooldownInterval = null;

    // ─── Reveal countdown state ───

    let revealEndTime = 0;
    let revealRAF = null;

    // ─── Walkthrough state ───

    let walkthroughActive = false;
    let walkthroughStep = 0;

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
        teaserSection.classList.add("hidden");
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

    // ─── Reveal Countdown ───

    function startRevealCountdown(durationMs) {
        // Cancel any existing countdown (e.g. dev reveal while game reveal is active)
        if (revealRAF) cancelAnimationFrame(revealRAF);

        revealEndTime = performance.now() + durationMs;
        revealCountdown.classList.remove("hidden");
        revealTimerEl.classList.remove("urgent");
        tickRevealCountdown();
    }

    function tickRevealCountdown() {
        const remaining = Math.max(0, revealEndTime - performance.now());
        const ms = Math.ceil(remaining);
        revealTimerEl.textContent = ms > 0 ? `${ms}ms` : "0ms";

        // Turn red under 500ms
        revealTimerEl.classList.toggle("urgent", ms <= 500);

        if (ms > 0) {
            revealRAF = requestAnimationFrame(tickRevealCountdown);
        } else {
            stopRevealCountdown();
        }
    }

    function stopRevealCountdown() {
        if (revealRAF) {
            cancelAnimationFrame(revealRAF);
            revealRAF = null;
        }
        revealCountdown.classList.add("hidden");
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

                // Advance walkthrough on result
                if (walkthroughActive) advanceWalkthrough();
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

            // Advance walkthrough on result (even on loss — shouldn't happen with force-win)
            if (walkthroughActive) advanceWalkthrough();
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
        // Notify walkthrough of state transitions
        if (walkthroughActive) onStateChangeForWalkthrough(s);
    }

    async function init() {
        setState("INIT");
        board.innerHTML = "";
        targetPrompt.classList.add("hidden");
        resultOverlay.classList.add("hidden");
        cooldownSection.classList.add("hidden");
        playBtn.classList.add("hidden");
        teaserSection.classList.add("hidden");
        stopRevealCountdown();

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

        // Show play button and teaser
        playBtn.classList.remove("hidden");
        playBtn.textContent = "Play";
        teaserSection.classList.remove("hidden");
    }

    async function startGame() {
        playBtn.classList.add("hidden");
        teaserSection.classList.add("hidden");
        setState("LOADING");
        spinner.classList.remove("hidden");

        // Preload images
        await preloadImages(gameData.tiles);
        spinner.classList.add("hidden");

        // REVEAL: show all tiles face-up
        setState("REVEAL");
        renderBoard(gameData.tiles, true);

        if (walkthroughActive) {
            // Walkthrough controls pacing — don't auto-flip on timer.
            // The walkthrough's onStateChangeForWalkthrough("REVEAL") will
            // advance to the "revealed" step, which pauses here until the
            // user clicks "Next".
            return;
        }

        startRevealCountdown(gameData.reveal_ms);

        // MEMORIZE: after reveal_ms, flip all down
        setTimeout(() => {
            stopRevealCountdown();
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

    // ─── Instructions Modal ───

    function openModal() {
        instructionsModal.classList.remove("hidden");
    }

    function closeModal() {
        instructionsModal.classList.add("hidden");
    }

    modalClose.addEventListener("click", closeModal);

    instructionsModal.addEventListener("click", (e) => {
        // Close when clicking outside the modal content box
        if (e.target === instructionsModal) closeModal();
    });

    replayTourLink.addEventListener("click", () => {
        closeModal();
        localStorage.removeItem("mg_walkthrough_done");
        startWalkthrough();
    });

    // ─── Side Panel ───

    function toggleSidePanel() {
        sidePanel.classList.toggle("collapsed");
    }

    sidePanelTab.addEventListener("click", toggleSidePanel);
    howToPlayBtn.addEventListener("click", toggleSidePanel);

    // ─── Walkthrough ───

    const WALKTHROUGH_STEPS = [
        {
            id: "welcome",
            title: "Welcome to Memory Garden!",
            text: "A quick memory game where you can win discount coupons. Let\u2019s take a quick tour!",
            position: "center",
            buttons: [
                { label: "Skip", action: "skip", style: "secondary" },
                { label: "Start Tour", action: "next", style: "primary" },
            ],
        },
        {
            id: "garden",
            title: "Your Garden",
            text: "Win games to fill squares. 12 squares = 1 completed garden.",
            position: "top-area",
            buttons: [{ label: "Next", action: "next", style: "primary" }],
        },
        {
            id: "play",
            title: "Start Playing",
            text: "Press Play to begin!",
            position: "above-play",
            arrow: "\u2193",
            buttons: [],
            waitForState: "REVEAL",
        },
        {
            id: "revealed",
            title: "Memorize the Tiles!",
            text: "These are the 12 tiles. In a real game you get 2 seconds to memorize their positions. Take your time now \u2014 when you\u2019re ready, we\u2019ll hide them.",
            position: "top-area",
            buttons: [{ label: "I\u2019m ready \u2014 hide them", action: "wt-flip-tiles", style: "primary" }],
        },
        {
            id: "target",
            title: "Find This Tile",
            text: "See the highlighted tile above the board? That\u2019s your target. You need to remember where it was and pick the right square.",
            position: "top-area",
            buttons: [{ label: "Got it \u2014 let me pick!", action: "wt-enable-select", style: "primary" }],
        },
        {
            id: "pick",
            title: "Tap a Tile",
            text: "Tap the tile you think matches the target. Go ahead!",
            position: "top-area",
            buttons: [],
            waitForState: "RESULT",
        },
        {
            id: "result",
            title: "Tour Complete!",
            text: "That\u2019s how it works! Play once every 24 hours for a chance to earn discount coupons. Good luck!",
            position: "center",
            buttons: [{ label: "Done", action: "done", style: "primary" }],
        },
    ];

    function startWalkthrough() {
        walkthroughActive = true;
        walkthroughStep = 0;

        // Force-win so the user sees a win during the walkthrough
        if (CFG.devMode) {
            fetch("/api/dev/force-win", { method: "POST" }).catch(() => {});
        }

        showWalkthroughStep();
    }

    function showWalkthroughStep() {
        const step = WALKTHROUGH_STEPS[walkthroughStep];
        if (!step) {
            endWalkthrough();
            return;
        }

        // Show overlay
        walkthroughOverlay.classList.remove("hidden");

        // Reset position styles
        walkthroughCard.style.top = "";
        walkthroughCard.style.bottom = "";

        // Position card
        walkthroughCard.className = "walkthrough-card " + step.position;
        walkthroughCard.classList.remove("hidden");

        // Build card content — always include a close × button
        let html = '<button class="wt-close" data-wt-action="skip">&times;</button>';
        html += `<h3>${step.title}</h3>`;
        if (step.arrow) {
            html += `<div class="wt-arrow">${step.arrow}</div>`;
        }
        html += `<p>${step.text}</p>`;

        if (step.buttons.length > 0) {
            html += '<div class="walkthrough-btns">';
            step.buttons.forEach((btn) => {
                html += `<button class="wt-btn ${btn.style}" data-wt-action="${btn.action}">${btn.label}</button>`;
            });
            html += '</div>';
        }

        walkthroughCard.innerHTML = html;

        // Position above-play: place the card so its bottom edge is above the Play button
        if (step.position === "above-play" && playBtn) {
            const btnRect = playBtn.getBoundingClientRect();
            walkthroughCard.style.bottom = (window.innerHeight - btnRect.top + 12) + "px";
            walkthroughCard.style.top = "auto";
        }

        // Bind button clicks
        walkthroughCard.querySelectorAll("[data-wt-action]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                const action = e.target.dataset.wtAction;
                if (action === "skip" || action === "done") {
                    endWalkthrough();
                } else if (action === "next") {
                    walkthroughStep++;
                    showWalkthroughStep();
                } else if (action === "wt-flip-tiles") {
                    // Walkthrough-controlled: flip tiles down, show target, advance
                    flipAllDown();
                    setTimeout(() => {
                        targetImage.src = gameData.target.url;
                        targetPrompt.classList.remove("hidden");
                        walkthroughStep++;
                        showWalkthroughStep();
                    }, 500);
                } else if (action === "wt-enable-select") {
                    // Walkthrough-controlled: enable tile selection, advance
                    enableSelection();
                    walkthroughStep++;
                    showWalkthroughStep();
                }
            });
        });

        // If this step waits for a game state, hide the overlay so user can interact
        if (step.waitForState) {
            walkthroughOverlay.classList.add("hidden");
        }
    }

    function onStateChangeForWalkthrough(newState) {
        const step = WALKTHROUGH_STEPS[walkthroughStep];
        if (!step || !step.waitForState) return;

        if (newState === step.waitForState) {
            walkthroughStep++;
            showWalkthroughStep();
        }
    }

    function advanceWalkthrough() {
        // Called from handleResult to move to the "result" step
        const step = WALKTHROUGH_STEPS[walkthroughStep];
        if (step && step.waitForState === "RESULT") {
            walkthroughStep++;
            showWalkthroughStep();
        }
    }

    function endWalkthrough() {
        const wasActive = walkthroughActive;
        walkthroughActive = false;
        walkthroughStep = 0;
        walkthroughOverlay.classList.add("hidden");
        walkthroughCard.classList.add("hidden");
        localStorage.setItem("mg_walkthrough_done", "1");

        // If ended mid-game (tiles on screen but game not finished), reset cleanly
        if (wasActive && state !== "INIT" && state !== "COOLDOWN" && state !== "RESULT") {
            init();
        }
    }

    // ─── Event bindings ───

    playBtn.addEventListener("click", startGame);

    resultDismiss.addEventListener("click", async () => {
        resultOverlay.classList.add("hidden");

        // Continuous play: auto-reset cooldown if checkbox is checked
        if (continuousPlayBox && continuousPlayBox.checked) {
            await fetch("/api/dev/reset-cooldown", { method: "POST" }).catch(() => {});
        }

        init(); // re-fetch status (will show cooldown or new board)
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
        const revealDuration = 1500;
        // Flip all face-up for 1.5s, then back down
        tiles.forEach((t) => t.classList.remove("flipped"));
        startRevealCountdown(revealDuration);
        out.textContent = "Tiles revealed for 1.5s...";
        setTimeout(() => {
            stopRevealCountdown();
            board.querySelectorAll(".tile").forEach((t) => {
                if (t.classList.contains("selectable")) t.classList.add("flipped");
            });
            out.textContent = "Tiles hidden again.";
        }, revealDuration);
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

    window.devRunWalkthrough = async function () {
        const out = $("#devOutput");
        out.textContent = "Starting walkthrough...";
        // End any active walkthrough without saving to localStorage
        if (walkthroughActive) {
            walkthroughActive = false;
            walkthroughStep = 0;
            walkthroughOverlay.classList.add("hidden");
            walkthroughCard.classList.add("hidden");
        }
        // Reset cooldown so Play button is available, force a win for the tour
        try {
            await fetch("/api/dev/reset-cooldown", { method: "POST" });
            await fetch("/api/dev/force-win", { method: "POST" });
        } catch (e) { /* best-effort */ }
        localStorage.removeItem("mg_walkthrough_done");
        await init();
        startWalkthrough();
    };

    // ─── Boot ───

    init().then(() => {
        // Check if walkthrough should auto-start
        if (!localStorage.getItem("mg_walkthrough_done")) {
            startWalkthrough();
        }
    });
})();
