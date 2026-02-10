/**
 * GamePage — Full port of the Memory Garden game state machine.
 *
 * States: INIT → READY → LOADING → REVEAL → MEMORIZE → PROMPT → SELECT → RESULT → COOLDOWN
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { ensureUser, fetchStatus, submitPlay, devAction, devGetUserState } from '../api.js'

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true'

const WALKTHROUGH_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Memory Garden!',
    text: 'A quick memory game where you can win discount coupons. Let\u2019s take a quick tour!',
    position: 'center',
    buttons: [
      { label: 'Skip', action: 'skip', style: 'secondary' },
      { label: 'Start Tour', action: 'next', style: 'primary' },
    ],
  },
  {
    id: 'garden',
    title: 'Your Garden',
    text: 'Win games to fill squares. 12 squares = 1 completed garden.',
    position: 'top-area',
    buttons: [{ label: 'Next', action: 'next', style: 'primary' }],
  },
  {
    id: 'play',
    title: 'Start Playing',
    text: 'Press Play to begin!',
    position: 'above-play',
    arrow: '\u2193',
    buttons: [],
    waitForState: 'REVEAL',
  },
  {
    id: 'revealed',
    title: 'Memorize the Tiles!',
    text: 'These are the 12 tiles. In a real game you get 2 seconds to memorize their positions. Take your time now \u2014 when you\u2019re ready, we\u2019ll hide them.',
    position: 'top-area',
    buttons: [{ label: 'I\u2019m ready \u2014 hide them', action: 'wt-flip-tiles', style: 'primary' }],
  },
  {
    id: 'target',
    title: 'Find This Tile',
    text: 'See the highlighted tile above the board? That\u2019s your target. You need to remember where it was and pick the right square.',
    position: 'top-area',
    buttons: [{ label: 'Got it \u2014 let me pick!', action: 'wt-enable-select', style: 'primary' }],
  },
  {
    id: 'pick',
    title: 'Tap a Tile',
    text: 'Tap the tile you think matches the target. Go ahead!',
    position: 'top-area',
    buttons: [],
    waitForState: 'RESULT',
  },
  {
    id: 'result',
    title: 'Tour Complete!',
    text: 'That\u2019s how it works! Play once every 24 hours for a chance to earn discount coupons. Good luck!',
    position: 'center',
    buttons: [{ label: 'Done', action: 'done', style: 'primary' }],
  },
]

function preloadImages(tiles) {
  return Promise.all(
    tiles.map(
      (t) =>
        new Promise((resolve) => {
          const img = new Image()
          img.onload = resolve
          img.onerror = resolve
          img.src = t.url
        })
    )
  )
}

function formatCooldown(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function GamePage() {
  // ─── Game state ───
  const [gameState, setGameState] = useState('INIT')
  const [tiles, setTiles] = useState([])
  const [target, setTarget] = useState(null)
  const [revealMs, setRevealMs] = useState(2000)
  const [squaresClaimed, setSquaresClaimed] = useState(0)
  const [squaresPerGarden, setSquaresPerGarden] = useState(12)
  const [gardensCompleted, setGardensCompleted] = useState(0)

  // Tile display state
  const [allFaceUp, setAllFaceUp] = useState(false)
  const [selectable, setSelectable] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [correctRevealId, setCorrectRevealId] = useState(null)
  const [wrongRevealId, setWrongRevealId] = useState(null)
  const [showTarget, setShowTarget] = useState(false)

  // Cooldown
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  // Reveal countdown
  const [revealCountdownMs, setRevealCountdownMs] = useState(0)
  const [showRevealCountdown, setShowRevealCountdown] = useState(false)

  // Result overlay
  const [showResult, setShowResult] = useState(false)
  const [resultData, setResultData] = useState(null)
  const [showRoller, setShowRoller] = useState(false)
  const [rollerFinal, setRollerFinal] = useState('')
  const [showCoupon, setShowCoupon] = useState(false)
  const [showGardenComplete, setShowGardenComplete] = useState(false)

  // Loading spinner
  const [showSpinner, setShowSpinner] = useState(false)

  // Teaser + play button visibility
  const [showPlayBtn, setShowPlayBtn] = useState(false)
  const [showTeaser, setShowTeaser] = useState(false)

  // UI state
  const [showInstructionsModal, setShowInstructionsModal] = useState(false)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)

  // Walkthrough
  const [walkthroughActive, setWalkthroughActive] = useState(false)
  const [walkthroughStep, setWalkthroughStep] = useState(0)
  const [showWalkthroughOverlay, setShowWalkthroughOverlay] = useState(false)
  const [showWalkthroughCard, setShowWalkthroughCard] = useState(false)

  // Garden animation
  const [justFilledIndex, setJustFilledIndex] = useState(null)

  // Dev panel
  const [devOutput, setDevOutput] = useState('')
  const [continuousPlay, setContinuousPlay] = useState(false)

  // Refs
  const revealEndRef = useRef(0)
  const rafRef = useRef(null)
  const cooldownIntervalRef = useRef(null)
  const rollerStripRef = useRef(null)
  const playBtnRef = useRef(null)
  const gameDataRef = useRef(null)
  const walkthroughActiveRef = useRef(false)
  const walkthroughStepRef = useRef(0)
  const gameStateRef = useRef('INIT')
  const initRunningRef = useRef(false)

  // Keep refs in sync with state for use in callbacks
  useEffect(() => { walkthroughActiveRef.current = walkthroughActive }, [walkthroughActive])
  useEffect(() => { walkthroughStepRef.current = walkthroughStep }, [walkthroughStep])
  useEffect(() => { gameStateRef.current = gameState }, [gameState])

  // ─── Init: fetch user + status ───
  const init = useCallback(async () => {
    if (initRunningRef.current) return
    initRunningRef.current = true

    try {
      setGameState('INIT')
      setTiles([])
      setShowTarget(false)
      setShowResult(false)
      setShowPlayBtn(false)
      setShowTeaser(false)
      setShowSpinner(false)
      setAllFaceUp(false)
      setSelectable(false)
      setSelectedId(null)
      setCorrectRevealId(null)
      setWrongRevealId(null)
      setShowRevealCountdown(false)

      // Stop any running timers
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current)
        cooldownIntervalRef.current = null
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      const user = await ensureUser()
      setSquaresClaimed(user.squares_claimed)
      setGardensCompleted(user.gardens_completed)

      const status = await fetchStatus()

      if (!status.can_play) {
        setSquaresClaimed(status.squares_claimed)
        setSquaresPerGarden(status.squares_per_garden)
        setGardensCompleted(status.gardens_completed)
        startCooldown(status.remaining_seconds)
        return
      }

      gameDataRef.current = status
      setSquaresClaimed(status.squares_claimed)
      setSquaresPerGarden(status.squares_per_garden)
      setGardensCompleted(status.gardens_completed)
      setRevealMs(status.reveal_ms)

      setGameState('READY')
      setShowPlayBtn(true)
      setShowTeaser(true)
    } finally {
      initRunningRef.current = false
    }
  }, [])

  // ─── Cooldown ───
  const startCooldown = useCallback((remainingSeconds) => {
    setGameState('COOLDOWN')
    setCooldownRemaining(remainingSeconds)
    setShowPlayBtn(false)
    setShowTeaser(false)
    setTiles([])
    setShowTarget(false)

    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current)

    let remaining = remainingSeconds
    cooldownIntervalRef.current = setInterval(() => {
      remaining--
      if (remaining <= 0) {
        clearInterval(cooldownIntervalRef.current)
        cooldownIntervalRef.current = null
        setCooldownRemaining(0)
      } else {
        setCooldownRemaining(remaining)
      }
    }, 1000)
  }, [])

  // When cooldown reaches 0, re-init
  useEffect(() => {
    if (gameStateRef.current === 'COOLDOWN' && cooldownRemaining === 0 && !initRunningRef.current) {
      init()
    }
  }, [cooldownRemaining, init])

  // ─── Reveal countdown (requestAnimationFrame) ───
  const startRevealCountdown = useCallback((durationMs) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    revealEndRef.current = performance.now() + durationMs
    setShowRevealCountdown(true)
    setRevealCountdownMs(durationMs)

    const tick = () => {
      const remaining = Math.max(0, revealEndRef.current - performance.now())
      const ms = Math.ceil(remaining)
      setRevealCountdownMs(ms)
      if (ms > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setShowRevealCountdown(false)
        rafRef.current = null
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stopRevealCountdown = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    setShowRevealCountdown(false)
  }, [])

  // ─── Start game ───
  const startGame = useCallback(async () => {
    const data = gameDataRef.current
    if (!data) return

    setShowPlayBtn(false)
    setShowTeaser(false)
    setGameState('LOADING')
    setShowSpinner(true)

    await preloadImages(data.tiles)
    setShowSpinner(false)

    // REVEAL: show tiles face-up
    setGameState('REVEAL')
    setTiles(data.tiles)
    setTarget(data.target)
    setAllFaceUp(true)

    if (walkthroughActiveRef.current) {
      // Walkthrough controls pacing — don't auto-flip
      return
    }

    startRevealCountdown(data.reveal_ms)

    // After reveal, flip down and show target
    setTimeout(() => {
      stopRevealCountdown()
      setGameState('MEMORIZE')
      setAllFaceUp(false)

      setTimeout(() => {
        setGameState('PROMPT')
        setShowTarget(true)

        setGameState('SELECT')
        setSelectable(true)
      }, 400)
    }, data.reveal_ms)
  }, [startRevealCountdown, stopRevealCountdown])

  // ─── Tile selection ───
  const onTileSelect = useCallback(async (tileId) => {
    if (gameStateRef.current !== 'SELECT') return

    setSelectable(false)
    setSelectedId(tileId)

    setGameState('RESULT')
    const result = await submitPlay(tileId)
    setResultData(result)
    setShowResult(true)

    // Reset roller/coupon visibility
    setShowRoller(false)
    setShowCoupon(false)
    setShowGardenComplete(false)
    setRollerFinal('')

    if (result.result === 'win') {
      // Start roller animation
      setShowRoller(true)
      playRewardRoller(result.reward_percentage, () => {
        setShowCoupon(true)

        if (result.garden_just_completed) {
          setShowGardenComplete(true)
          setSquaresClaimed(result.squares_per_garden)
          setGardensCompleted(result.gardens_completed - 1)
          setTimeout(() => {
            setSquaresClaimed(0)
            setGardensCompleted(result.gardens_completed)
          }, 1500)
        } else {
          setSquaresClaimed(result.squares_claimed)
          setGardensCompleted(result.gardens_completed)
          animateGardenSquare(result.squares_claimed - 1)
        }

        if (walkthroughActiveRef.current) {
          advanceWalkthrough()
        }
      })
    } else {
      // Loss — reveal correct tile
      setCorrectRevealId(result.correct_tile_id)
      if (tileId !== result.correct_tile_id) {
        setWrongRevealId(tileId)
      }
      setSquaresClaimed(result.squares_claimed)
      setGardensCompleted(result.gardens_completed)

      if (walkthroughActiveRef.current) {
        advanceWalkthrough()
      }
    }
  }, [])

  // ─── Reward Roller Animation ───
  const playRewardRoller = useCallback((finalPct, onDone) => {
    const values = [1, 2, 3, 1, 2, 3, 2, 1, 3, 2, 1, 3, finalPct]
    const itemHeight = 60
    const totalOffset = (values.length - 1) * itemHeight
    const duration = 800 + Math.random() * 400

    // Wait for next frame so the strip is rendered
    requestAnimationFrame(() => {
      const strip = rollerStripRef.current
      if (!strip) {
        setRollerFinal(`You won ${finalPct}% off!`)
        if (onDone) onDone()
        return
      }

      // Build strip items
      strip.innerHTML = ''
      values.forEach((v) => {
        const item = document.createElement('div')
        item.className = 'roller-item'
        item.textContent = `${v}%`
        strip.appendChild(item)
      })

      // Reset position
      strip.style.transition = 'none'
      strip.style.transform = 'translateY(0)'
      strip.offsetHeight // force reflow

      // Animate
      strip.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`
      strip.style.transform = `translateY(-${totalOffset}px)`

      setTimeout(() => {
        setRollerFinal(`You won ${finalPct}% off!`)
        if (onDone) onDone()
      }, duration + 200)
    })
  }, [])

  // ─── Garden animation ───
  const animateGardenSquare = useCallback((index) => {
    setJustFilledIndex(index)
    setTimeout(() => setJustFilledIndex(null), 500)
  }, [])

  // ─── Result dismiss ───
  const dismissResult = useCallback(async () => {
    setShowResult(false)
    setSelectedId(null)
    setCorrectRevealId(null)
    setWrongRevealId(null)

    if (continuousPlay && DEV_MODE) {
      try { await devAction('reset-cooldown') } catch {}
    }

    init()
  }, [continuousPlay, init])

  // ─── Walkthrough ───
  const startWalkthrough = useCallback(() => {
    setWalkthroughActive(true)
    walkthroughActiveRef.current = true
    setWalkthroughStep(0)
    walkthroughStepRef.current = 0

    if (DEV_MODE) {
      devAction('force-win').catch(() => {})
    }
  }, [])

  const showWalkthroughStepFn = useCallback(() => {
    const step = WALKTHROUGH_STEPS[walkthroughStepRef.current]
    if (!step) {
      endWalkthrough()
      return
    }

    setShowWalkthroughCard(true)

    if (step.waitForState) {
      setShowWalkthroughOverlay(false)
    } else {
      setShowWalkthroughOverlay(true)
    }
  }, [])

  const endWalkthrough = useCallback(() => {
    const wasActive = walkthroughActiveRef.current
    setWalkthroughActive(false)
    walkthroughActiveRef.current = false
    setWalkthroughStep(0)
    walkthroughStepRef.current = 0
    setShowWalkthroughOverlay(false)
    setShowWalkthroughCard(false)
    localStorage.setItem('mg_walkthrough_done', '1')

    const currentState = gameStateRef.current
    if (wasActive && currentState !== 'INIT' && currentState !== 'COOLDOWN' && currentState !== 'RESULT') {
      init()
    }
  }, [init])

  const advanceWalkthrough = useCallback(() => {
    const step = WALKTHROUGH_STEPS[walkthroughStepRef.current]
    if (step && step.waitForState === 'RESULT') {
      const nextStep = walkthroughStepRef.current + 1
      setWalkthroughStep(nextStep)
      walkthroughStepRef.current = nextStep
    }
  }, [])

  const handleWalkthroughAction = useCallback((action) => {
    if (action === 'skip' || action === 'done') {
      endWalkthrough()
    } else if (action === 'next') {
      const nextStep = walkthroughStepRef.current + 1
      setWalkthroughStep(nextStep)
      walkthroughStepRef.current = nextStep
    } else if (action === 'wt-flip-tiles') {
      setAllFaceUp(false)
      setTimeout(() => {
        setShowTarget(true)
        const nextStep = walkthroughStepRef.current + 1
        setWalkthroughStep(nextStep)
        walkthroughStepRef.current = nextStep
      }, 500)
    } else if (action === 'wt-enable-select') {
      setSelectable(true)
      setGameState('SELECT')
      const nextStep = walkthroughStepRef.current + 1
      setWalkthroughStep(nextStep)
      walkthroughStepRef.current = nextStep
    }
  }, [endWalkthrough])

  // Watch for game state changes during walkthrough
  useEffect(() => {
    if (!walkthroughActive) return
    const step = WALKTHROUGH_STEPS[walkthroughStep]
    if (!step || !step.waitForState) return

    if (gameState === step.waitForState) {
      const nextStep = walkthroughStep + 1
      setWalkthroughStep(nextStep)
      walkthroughStepRef.current = nextStep
    }
  }, [gameState, walkthroughActive, walkthroughStep])

  // Show walkthrough step when step changes
  useEffect(() => {
    if (walkthroughActive) {
      showWalkthroughStepFn()
    }
  }, [walkthroughStep, walkthroughActive, showWalkthroughStepFn])

  // ─── Boot ───
  useEffect(() => {
    init().then(() => {
      if (!localStorage.getItem('mg_walkthrough_done')) {
        startWalkthrough()
      }
    })

    return () => {
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Dev tools ───
  const handleDevAction = useCallback(async (action) => {
    try {
      const data = await devAction(action)
      setDevOutput(JSON.stringify(data, null, 2))
      init()
    } catch (e) {
      setDevOutput(`Error: ${e.message}`)
    }
  }, [init])

  const handleDevRevealTiles = useCallback(() => {
    if (!tiles.length || allFaceUp) {
      setDevOutput('No hidden tiles to reveal.')
      return
    }
    setAllFaceUp(true)
    startRevealCountdown(1500)
    setDevOutput('Tiles revealed for 1.5s...')
    setTimeout(() => {
      stopRevealCountdown()
      if (gameStateRef.current === 'SELECT') {
        setAllFaceUp(false)
      }
      setDevOutput('Tiles hidden again.')
    }, 1500)
  }, [tiles, allFaceUp, startRevealCountdown, stopRevealCountdown])

  const handleDevShowState = useCallback(async () => {
    try {
      const data = await devGetUserState()
      setDevOutput(JSON.stringify(data, null, 2))
    } catch (e) {
      setDevOutput(`Error: ${e.message}`)
    }
  }, [])

  const handleDevRunWalkthrough = useCallback(async () => {
    setDevOutput('Starting walkthrough...')
    if (walkthroughActiveRef.current) {
      setWalkthroughActive(false)
      walkthroughActiveRef.current = false
      setWalkthroughStep(0)
      walkthroughStepRef.current = 0
      setShowWalkthroughOverlay(false)
      setShowWalkthroughCard(false)
    }
    try {
      await devAction('reset-cooldown')
      await devAction('force-win')
    } catch {}
    localStorage.removeItem('mg_walkthrough_done')
    await init()
    startWalkthrough()
  }, [init, startWalkthrough])

  // ─── Tile class computation ───
  const getTileClass = useCallback((tileId) => {
    const classes = ['tile']
    const isFaceUp = allFaceUp || selectedId === tileId || correctRevealId === tileId
    if (!isFaceUp) classes.push('flipped')
    if (selectable) classes.push('selectable')
    if (selectedId === tileId) classes.push('selected')
    if (correctRevealId === tileId) classes.push('correct-reveal')
    if (wrongRevealId === tileId) classes.push('wrong-reveal')
    return classes.join(' ')
  }, [allFaceUp, selectedId, correctRevealId, wrongRevealId, selectable])

  // ─── Current walkthrough step data ───
  const currentWtStep = walkthroughActive ? WALKTHROUGH_STEPS[walkthroughStep] : null

  // ─── Walkthrough card position style ───
  const getWtCardStyle = () => {
    if (!currentWtStep) return {}
    if (currentWtStep.position === 'above-play' && playBtnRef.current) {
      const rect = playBtnRef.current.getBoundingClientRect()
      return {
        bottom: (window.innerHeight - rect.top + 12) + 'px',
        top: 'auto',
      }
    }
    return {}
  }

  // ─── Render ───
  return (
    <div className="page-layout">
      <div className="game-container">

        {/* Header */}
        <header className="game-header">
          <h1>Memory Garden</h1>
          <p className="tagline">Test your memory. Takes 3 seconds.</p>
          <button
            className="btn-how-to-play"
            onClick={() => setSidePanelOpen(!sidePanelOpen)}
          >
            How to Play
          </button>
        </header>

        {/* Garden Progress */}
        <div className="garden-section">
          <div className="garden-label">Your Memory Garden</div>
          <div className="garden-grid">
            {Array.from({ length: squaresPerGarden }, (_, i) => (
              <div
                key={i}
                className={
                  'garden-square' +
                  (i < squaresClaimed ? ' filled' : '') +
                  (justFilledIndex === i ? ' just-filled' : '')
                }
              />
            ))}
          </div>
          <div className="garden-stats">
            <span>Gardens Completed: {gardensCompleted}</span>
          </div>
        </div>

        {/* Cooldown */}
        {gameState === 'COOLDOWN' && cooldownRemaining > 0 && (
          <div className="cooldown-section">
            <p className="cooldown-label">New board available in</p>
            <p className="cooldown-timer">{formatCooldown(cooldownRemaining)}</p>
          </div>
        )}

        {/* Target Prompt */}
        {showTarget && target && (
          <div className="target-prompt">
            <p>Find this tile:</p>
            <div className="target-tile-wrapper">
              <img src={target.url} alt="Target tile" />
            </div>
          </div>
        )}

        {/* Reveal Countdown */}
        {showRevealCountdown && (
          <div className="reveal-countdown">
            <div className="rc-label">Ready!</div>
            <div className={`rc-timer${revealCountdownMs <= 500 ? ' urgent' : ''}`}>
              {revealCountdownMs > 0 ? `${revealCountdownMs}ms` : '0ms'}
            </div>
          </div>
        )}

        {/* Game Board */}
        <div className="board-wrapper">
          <div className="game-board">
            {tiles.map((tile) => (
              <div
                key={tile.id}
                className={getTileClass(tile.id)}
                onClick={() => selectable && onTileSelect(tile.id)}
              >
                <div className="tile-inner">
                  <div className="tile-face">
                    <img src={tile.url} alt="tile" />
                  </div>
                  <div className="tile-back"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Result Overlay */}
        {showResult && resultData && (
          <div className="result-overlay">
            <div className="result-content">
              <div className={`result-message ${resultData.result}`}>
                {resultData.result === 'win' ? 'Correct!' : 'So close.'}
              </div>

              {/* Reward Roller */}
              {showRoller && (
                <div className="reward-roller">
                  <div className="roller-window">
                    <div className="roller-strip" ref={rollerStripRef}></div>
                  </div>
                  <div className="reward-final">{rollerFinal}</div>
                </div>
              )}

              {/* Coupon Display */}
              {showCoupon && resultData.coupon_code && (
                <div className="coupon-display">
                  <p className="coupon-label">Your discount code:</p>
                  <div className="coupon-code">{resultData.coupon_code}</div>
                  <p className="coupon-pct">{resultData.reward_percentage}% off your next order</p>
                </div>
              )}

              {/* Garden Complete */}
              {showGardenComplete && (
                <div className="garden-complete">
                  <p>Garden Complete!</p>
                </div>
              )}

              <button className="btn-dismiss" onClick={dismissResult}>Continue</button>
            </div>
          </div>
        )}

        {/* Premium Placeholder */}
        <div className="premium-placeholder">
          <span className="lock-icon">&#128274;</span> Premium Attempts &mdash; Coming Soon
        </div>

        {/* Loading Spinner */}
        {showSpinner && (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Preparing your board...</p>
          </div>
        )}

        {/* Teaser Roller */}
        {showTeaser && (
          <div className="teaser-section">
            <div className="teaser-label">Win up to 3% off!</div>
            <div className="teaser-window">
              <div className="teaser-strip">
                <div className="teaser-item">1%</div>
                <div className="teaser-item">2%</div>
                <div className="teaser-item">3%</div>
                <div className="teaser-item">1%</div>
              </div>
            </div>
          </div>
        )}

        {/* Play Button */}
        {showPlayBtn && (
          <button
            ref={playBtnRef}
            className="btn-play"
            onClick={startGame}
          >
            Play
          </button>
        )}

        {/* Dev Panel */}
        {DEV_MODE && (
          <details className="dev-panel">
            <summary>Dev Tools</summary>
            <div className="dev-buttons">
              <button onClick={() => handleDevAction('reset-cooldown')}>Reset Cooldown</button>
              <button onClick={() => handleDevAction('set-cooldown?seconds=10')}>Set 10s Cooldown</button>
              <button onClick={() => handleDevAction('reset-garden')}>Reset Garden</button>
              <button onClick={() => handleDevAction('force-win')}>Force Win</button>
              <button onClick={() => handleDevAction('force-loss')}>Force Loss</button>
              <button onClick={handleDevRevealTiles}>Reveal Tiles</button>
              <button onClick={handleDevShowState}>Show User State</button>
              <button onClick={handleDevRunWalkthrough}>Run Walkthrough</button>
            </div>
            <div className="dev-continuous">
              <label>
                <input
                  type="checkbox"
                  checked={continuousPlay}
                  onChange={(e) => setContinuousPlay(e.target.checked)}
                />
                Continuous Play (auto-reset cooldown)
              </label>
            </div>
            <pre className="dev-output">{devOutput}</pre>
            <div className="dev-docs">
              <h4>Button Reference</h4>
              <dl>
                <dt>Reset Cooldown</dt>
                <dd>Clears the 24h cooldown so you can play again immediately.</dd>
                <dt>Set 10s Cooldown</dt>
                <dd>Sets cooldown to expire in 10 seconds (tests countdown timer).</dd>
                <dt>Reset Garden</dt>
                <dd>Resets squares to 0 and gardens completed to 0.</dd>
                <dt>Force Win</dt>
                <dd>Next play will be a win regardless of tile selection.</dd>
                <dt>Force Loss</dt>
                <dd>Next play will be a loss regardless of tile selection.</dd>
                <dt>Reveal Tiles</dt>
                <dd>Flips all hidden tiles face-up for 1.5s during SELECT phase.</dd>
                <dt>Show User State</dt>
                <dd>Dumps full user document from MongoDB as JSON.</dd>
                <dt>Run Walkthrough</dt>
                <dd>Resets and restarts the guided first-play walkthrough tour.</dd>
                <dt>Continuous Play</dt>
                <dd>When checked, auto-resets cooldown after dismissing results.</dd>
              </dl>
            </div>
          </details>
        )}
      </div>

      {/* Side Panel: How to Play */}
      <div className={`side-panel${sidePanelOpen ? '' : ' collapsed'}`}>
        <button className="side-panel-tab" onClick={() => setSidePanelOpen(!sidePanelOpen)}>
          <span className="tab-icon">?</span> How to Play
        </button>
        <div className="side-panel-body">
          <h3>How to Play</h3>
          <ol>
            <li>
              <span className="sp-num">1</span>
              <span className="sp-text"><strong>Look</strong> &mdash; 12 tiles are revealed for 2 seconds. Memorize them!</span>
            </li>
            <li>
              <span className="sp-num">2</span>
              <span className="sp-text"><strong>Find</strong> &mdash; One tile is highlighted as your target. Find it on the board.</span>
            </li>
            <li>
              <span className="sp-num">3</span>
              <span className="sp-text"><strong>Win</strong> &mdash; Pick correctly to earn a discount coupon (1&ndash;3% off).</span>
            </li>
          </ol>
          <hr className="sp-divider" />
          <p className="sp-tip">Fill all 12 garden squares to complete a garden. Play once every 24 hours.</p>
        </div>
      </div>

      {/* Instructions Modal */}
      {showInstructionsModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowInstructionsModal(false)}>
          <div className="modal-content">
            <button className="modal-close" onClick={() => setShowInstructionsModal(false)}>&times;</button>
            <h2>How to Play</h2>
            <ol className="modal-steps">
              <li>
                <span className="step-num">1</span>
                <span className="step-text"><strong>Look</strong> &mdash; 12 tiles are revealed for 2 seconds. Memorize them.</span>
              </li>
              <li>
                <span className="step-num">2</span>
                <span className="step-text"><strong>Find</strong> &mdash; One tile is highlighted as your target. Find it on the board.</span>
              </li>
              <li>
                <span className="step-num">3</span>
                <span className="step-text"><strong>Win</strong> &mdash; Pick correctly to earn a discount coupon (1&ndash;3% off).</span>
              </li>
            </ol>
            <div className="modal-footer">
              <a onClick={() => {
                setShowInstructionsModal(false)
                localStorage.removeItem('mg_walkthrough_done')
                startWalkthrough()
              }}>Replay Tour</a>
            </div>
          </div>
        </div>
      )}

      {/* Walkthrough Overlay */}
      {showWalkthroughOverlay && <div className="walkthrough-overlay"></div>}

      {/* Walkthrough Card */}
      {showWalkthroughCard && currentWtStep && (
        <div
          className={`walkthrough-card ${currentWtStep.position}`}
          style={getWtCardStyle()}
        >
          <button className="wt-close" onClick={() => endWalkthrough()}>&times;</button>
          <h3>{currentWtStep.title}</h3>
          {currentWtStep.arrow && <div className="wt-arrow">{currentWtStep.arrow}</div>}
          <p>{currentWtStep.text}</p>
          {currentWtStep.buttons.length > 0 && (
            <div className="walkthrough-btns">
              {currentWtStep.buttons.map((btn, i) => (
                <button
                  key={i}
                  className={`wt-btn ${btn.style}`}
                  onClick={() => handleWalkthroughAction(btn.action)}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
