export default function AboutPage() {
  return (
    <div className="page-container">
      <h1>About Memory Garden</h1>
      <p className="page-subtitle">A memory game where sharp minds win real rewards.</p>

      {/* Game Description */}
      <div className="info-card">
        <h3>The Game</h3>
        <p>
          Memory Garden is a fast-paced visual memory challenge. Twelve tiles are revealed for just
          two seconds &mdash; then they flip face-down. One tile is highlighted as your target.
          Find it among the hidden tiles to earn a discount coupon worth <span className="highlight">1&ndash;3% off</span> your next order.
        </p>
        <p>
          Win games to fill your garden with squares. Complete 12 squares to finish a garden.
          Play once every 24 hours and test your memory against the clock.
        </p>
      </div>

      {/* How to Play */}
      <h2>How to Play</h2>
      <div className="info-card">
        <ol className="steps-list">
          <li>
            <span className="step-num">1</span>
            <span className="step-text">
              <strong>Look</strong> &mdash; Press Play and 12 tiles are revealed for 2 seconds.
              Memorize their positions as fast as you can.
            </span>
          </li>
          <li>
            <span className="step-num">2</span>
            <span className="step-text">
              <strong>Find</strong> &mdash; The tiles flip face-down and one tile is highlighted
              as your target. Remember where you saw it.
            </span>
          </li>
          <li>
            <span className="step-num">3</span>
            <span className="step-text">
              <strong>Pick</strong> &mdash; Tap the tile you believe matches the target.
              Choose wisely &mdash; you only get one chance.
            </span>
          </li>
          <li>
            <span className="step-num">4</span>
            <span className="step-text">
              <strong>Win</strong> &mdash; Pick correctly to earn a discount coupon.
              The reward roller determines your prize: 1%, 2%, or 3% off.
            </span>
          </li>
          <li>
            <span className="step-num">5</span>
            <span className="step-text">
              <strong>Grow</strong> &mdash; Each win fills a square in your garden.
              Complete all 12 squares to finish a garden and start a new one.
            </span>
          </li>
        </ol>
      </div>

      {/* Build History */}
      <h2>Build History</h2>
      <div className="info-card">
        <span className="build-badge">v1.0 &mdash; React Frontend</span>
        <p>
          Memory Garden was architected and built by an <span className="highlight">absolute master
          of computer science</span> &mdash; a practitioner whose depth of knowledge spans full-stack
          engineering, distributed systems, infrastructure automation, and real-time application design.
        </p>
        <p>
          The backend is a Flask application with MongoDB persistence, session-based game validation,
          and a RESTful API layer. The frontend (what you're using now) is a React 19 single-page
          application built with Vite 7 and React Router 7, faithfully porting every animation,
          state transition, and interaction from the original server-rendered Jinja2 templates into
          a modern component-driven architecture.
        </p>
        <p>
          Every element &mdash; from the 3D tile flip animations to the reward roller, the guided
          walkthrough system, and the millisecond-precision reveal countdown &mdash; was designed
          with intention and implemented with precision. This is craftsmanship at the intersection
          of engineering rigor and user experience.
        </p>
      </div>
    </div>
  )
}
