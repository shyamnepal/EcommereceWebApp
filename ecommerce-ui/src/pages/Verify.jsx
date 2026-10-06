import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { verifyAccount } from '../services/api'
import './Auth.css'
import './Verify.css'

export default function Verify() {
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('userId')
  const redirectTo = searchParams.get('redirect') || '/'
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleCodeChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(val)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!userId) {
      setError('Invalid verification link. Please sign up again.')
      return
    }
    if (code.length !== 6) {
      setError('Please enter the 6-digit code from your email.')
      return
    }
    setLoading(true)
    try {
      // Call backend VerifyAccount API – user is only verified after this succeeds
      const res = await verifyAccount(userId, code)
      if (res?.Status === 'Failed' || res?.status === 'Failed') {
        setError(res?.Message ?? res?.message ?? 'Verification failed.')
        return
      }
      setSuccess(true)
      setTimeout(() => navigate(redirectTo !== '/' ? `/login?redirect=${encodeURIComponent(redirectTo)}` : '/login', { replace: true }), 1500)
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!userId) {
    return (
      <div className="auth-page">
        <div className="auth-card verify-card">
          <h1>Verification</h1>
          <p className="subtitle">Missing verification data. Please sign up again to receive a new code.</p>
          <Link to="/signup" className="verify-back-link">Back to Sign up</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card verify-card">
        <h1>Verify your email</h1>
        <p className="subtitle">We sent a 6-digit code to your email. Enter it below.</p>
        {success ? (
          <p className="auth-success verify-success">Account verified. Redirecting to sign in…</p>
        ) : (
          <form onSubmit={handleSubmit} className="verify-form">
            {error && <p className="auth-error">{error}</p>}
            <div className="verify-code-wrap">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={handleCodeChange}
                className="verify-code-input"
                style={{ color: '#1e293b', WebkitTextFillColor: '#1e293b' }}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary verify-submit" disabled={loading || code.length !== 6}>
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </form>
        )}
        <p className="footer-link">
          Didn’t get the code? <Link to="/signup">Sign up again</Link> or <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
