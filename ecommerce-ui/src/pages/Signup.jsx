import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { register as apiRegister } from '../services/api'
import './Auth.css'

const UserIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const MailIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const LockIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const AddressIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [address, setAddress] = useState('')
  const [agree, setAgree] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!agree) {
      setError('Please agree to the terms to continue.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await apiRegister({ userName, email, password, address })
      const userId = res?.data ?? res?.Data
      if (userId) {
        navigate(`/verify?userId=${encodeURIComponent(userId)}${redirectTo !== '/' ? `&redirect=${encodeURIComponent(redirectTo)}` : ''}`, { replace: true })
      } else {
        setSuccess('Account created. Please check your email to verify your account, then sign in.')
        setTimeout(() => navigate(redirectTo !== '/' ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login', { replace: true }), 3000)
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Try a different username or email.')
      setSuccess('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign Up</h1>
        <p className="subtitle">Create an account to checkout and manage orders</p>
        <form onSubmit={handleSubmit}>
          {error && <p className="auth-error">{error}</p>}
          {success && <p className="auth-success">{success}</p>}
          <div className="auth-input-wrap">
            <UserIcon />
            <div className="auth-input-inner">
              <input
                type="text"
                placeholder="Username"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                autoComplete="username"
                style={{ color: '#1e293b', WebkitTextFillColor: '#1e293b' }}
              />
            </div>
          </div>
          <div className="auth-input-wrap">
            <MailIcon />
            <div className="auth-input-inner">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{ color: '#1e293b', WebkitTextFillColor: '#1e293b' }}
              />
            </div>
          </div>
          <div className="auth-input-wrap">
            <LockIcon />
            <div className="auth-input-inner">
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                style={{ color: '#1e293b', WebkitTextFillColor: '#1e293b' }}
              />
            </div>
          </div>
          <div className="auth-input-wrap">
            <AddressIcon />
            <div className="auth-input-inner">
              <input
                type="text"
                placeholder="Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                autoComplete="street-address"
                style={{ color: '#1e293b', WebkitTextFillColor: '#1e293b' }}
              />
            </div>
          </div>
          <div className="auth-terms">
            <input
              id="terms"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
            />
            <label htmlFor="terms">
              I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>
            </label>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>
        <p className="footer-link">
          Already have an account? <Link to={redirectTo !== '/' ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login'}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
