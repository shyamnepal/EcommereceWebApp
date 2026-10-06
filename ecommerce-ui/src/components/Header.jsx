import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { ADMIN_DASHBOARD_PATH } from '../config'
import PromoBar from './PromoBar'
import './Header.css'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalItems } = useCart()
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const [q, setQ] = useState('')

  if (location.pathname.startsWith(ADMIN_DASHBOARD_PATH) || location.pathname.startsWith('/dashboard')) {
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  function handleSearch(e) {
    e.preventDefault()
    const query = q.trim()
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop')
  }

  return (
    <div className="store-top">
      <PromoBar />
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="header-logo">SoleStore</Link>
          <form className="header-search" onSubmit={handleSearch} role="search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search shoes…"
              aria-label="Search products"
            />
            <button type="submit">Search</button>
          </form>
          <nav className="header-nav">
            <Link to="/shop">Shop</Link>
            <Link to="/shop?category=shoes" className="header-nav-shoes">Shoes</Link>
            <Link to="/size-guide">Size guide</Link>
            {isAdmin && (
              <Link to={ADMIN_DASHBOARD_PATH} className="header-admin">
                Admin
              </Link>
            )}
            {isAuthenticated ? (
              <>
                <span className="header-user">Hi, {user}</span>
                <button type="button" className="header-logout" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/signup">Sign up</Link>
              </>
            )}
            <Link to="/cart" className="header-cart-link">
              Cart
              {totalItems > 0 && <span className="header-cart-badge">{totalItems}</span>}
            </Link>
          </nav>
        </div>
      </header>
    </div>
  )
}
