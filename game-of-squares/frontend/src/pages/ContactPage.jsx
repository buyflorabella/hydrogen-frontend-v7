import { useState } from 'react'

export default function ContactPage() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !message.trim()) return
    setShowModal(true)
  }

  const dismissModal = () => {
    setShowModal(false)
    setName('')
    setMessage('')
  }

  return (
    <div className="page-container">
      <h1>Contact</h1>
      <p className="page-subtitle">Send us a message. We'll find a way to get back to you.</p>

      <div className="info-card">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="contact-name">Name</label>
            <input
              id="contact-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              placeholder="What's on your mind?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-submit">Submit</button>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="contact-modal-overlay" onClick={(e) => e.target === e.currentTarget && dismissModal()}>
          <div className="contact-modal">
            <div className="modal-icon">&#9989;</div>
            <h3>Contact Submitted</h3>
            <p>
              Thank you, {name}. Your message has been received.
              We'll be in touch through our upcoming chat system.
            </p>
            <button className="btn-dismiss" onClick={dismissModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
