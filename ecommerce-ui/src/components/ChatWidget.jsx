import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { sendChatMessage } from '../services/api'
import { ADMIN_DASHBOARD_PATH } from '../config'
import './ChatWidget.css'

export default function ChatWidget() {
  const { pathname } = useLocation()
  const onDashboard = pathname.startsWith(ADMIN_DASHBOARD_PATH) || pathname.startsWith('/dashboard')
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your SoleStore assistant. Ask about products, sizing, shipping, or returns." },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  if (onDashboard) return null

  async function handleSend(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)
    try {
      const reply = await sendChatMessage(text)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-widget">
      {open && (
        <div className="chat-widget-panel">
          <div className="chat-widget-header">
            <span>SoleStore Assistant</span>
            <button
              type="button"
              className="chat-widget-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </div>
          <div className="chat-widget-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-widget-msg chat-widget-msg--${msg.role}`}>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div className="chat-widget-msg chat-widget-msg--assistant chat-widget-typing">
                ...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-widget-form" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about products, shipping..."
              disabled={loading}
              maxLength={500}
            />
            <button type="submit" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        className="chat-widget-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Open chat'}
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  )
}
