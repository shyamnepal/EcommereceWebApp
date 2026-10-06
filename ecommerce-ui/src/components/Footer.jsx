import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ADMIN_DASHBOARD_PATH } from '../config'
import './Footer.css'

export default function Footer() {
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  if (location.pathname.startsWith(ADMIN_DASHBOARD_PATH) || location.pathname.startsWith('/dashboard')) {
    return null
  }

  function handleSubscribe(e) {
    e.preventDefault()
    if (!email.trim()) return
    setDone(true)
    setEmail('')
  }

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-col">
          <h3>SoleStore</h3>
          <p>Everyday shoes built for comfort, style, and the long walk. Designed for people who live on their feet.</p>
        </div>
        <div className="site-footer-col">
          <h4>Shop</h4>
          <Link to="/shop">All products</Link>
          <Link to="/shop?category=shoes">Shoes</Link>
          <Link to="/size-guide">Size guide</Link>
        </div>
        <div className="site-footer-col">
          <h4>Help</h4>
          <Link to="/shipping">Shipping</Link>
          <Link to="/returns">Returns &amp; exchanges</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="site-footer-col">
          <h4>Company</h4>
          <Link to="/about">About us</Link>
          <p className="site-footer-note">Questions? We reply within one business day.</p>
          <form className="site-footer-form" onSubmit={handleSubscribe}>
            {done ? (
              <p className="site-footer-thanks">You’re on the list. Welcome.</p>
            ) : (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email for drops & offers"
                  required
                />
                <button type="submit">Join</button>
              </>
            )}
          </form>
        </div>
      </div>
      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} SoleStore. All rights reserved.</span>
        <span>Secure checkout · Visa · Mastercard · Amex</span>
      </div>
    </footer>
  )
}
