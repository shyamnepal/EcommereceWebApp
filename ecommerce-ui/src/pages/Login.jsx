import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, isAdminToken } from '../context/AuthContext'
import { login as apiLogin } from '../services/api'
import { ADMIN_DASHBOARD_PATH } from '../config'
import './Auth.css'

const UserIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const LockIcon = () => (
  <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
)

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function Login() {
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const queryRedirect = searchParams.get('redirect')
  const fromGuard = typeof location.state?.from === 'string' ? location.state.from : null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiLogin({ userName, password })
      const token = res?.token ?? res?.Token
      const payload = res?.data ?? res?.Data ?? {}
      const roles = payload.roles ?? payload.Roles ?? []
      const name = payload.userName ?? payload.UserName ?? res?.userName ?? res?.UserName ?? userName
      if (token) {
        login(token, name, roles)
        const dest = fromGuard || queryRedirect || (isAdminToken(token, roles) ? ADMIN_DASHBOARD_PATH : '/')
        navigate(dest, { replace: true })
      } else {
        setError(res?.message ?? res?.Message ?? 'Login failed')
      }
    } catch (err) {
      setError(err.message || 'Login failed. Check your username and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Sign In</h1>
        <p className="subtitle">Sign in with your username to checkout</p>
        <form onSubmit={handleSubmit}>
          {error && <p className="auth-error">{error}</p>}
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
            <LockIcon />
            <div className="auth-input-inner">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ color: '#1e293b', WebkitTextFillColor: '#1e293b' }}
              />
            </div>
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p className="footer-link">
          New here? <Link to={queryRedirect ? `/signup?redirect=${encodeURIComponent(queryRedirect)}` : '/signup'}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
