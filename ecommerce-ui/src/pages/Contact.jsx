import { useState } from 'react'
import './StoreContent.css'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', orderId: '', message: '' })
  const [sent, setSent] = useState(false)

  function onChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function onSubmit(e) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="page store-content">
      <header className="store-hero-lite">
        <p className="store-kicker">Support</p>
        <h1>Contact us</h1>
        <p>Order questions, sizing help, or a damaged pair—send a note and we’ll get back within one business day.</p>
      </header>
      {sent ? (
        <div className="store-success">
          Thanks {form.name || 'there'}. We received your message and will reply to {form.email}.
        </div>
      ) : (
        <form className="store-form" onSubmit={onSubmit}>
          <label>
            Name *
            <input name="name" value={form.name} onChange={onChange} required />
          </label>
          <label>
            Email *
            <input type="email" name="email" value={form.email} onChange={onChange} required />
          </label>
          <label>
            Order number (optional)
            <input name="orderId" value={form.orderId} onChange={onChange} placeholder="#1042" />
          </label>
          <label>
            Message *
            <textarea name="message" value={form.message} onChange={onChange} rows={5} required />
          </label>
          <button type="submit" className="store-submit">Send message</button>
        </form>
      )}
      <div className="store-prose">
        <p><strong>Hours:</strong> Mon–Fri, 9am–6pm.</p>
        <p><strong>Email:</strong> hello@solestore.shop</p>
      </div>
    </div>
  )
}
