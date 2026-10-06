import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './auth.css'
import './otp.css'

export default function OTP() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  function handleChange(index, value) {
    if (!/^\d*$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('')
    const next = [...digits]
    pasted.forEach((char, i) => { next[i] = char })
    setDigits(next)
    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  function handleSubmit(e) {
    e.preventDefault()
    const code = digits.join('')
    if (code.length !== 6) return
    console.log('OTP verified:', code)
    navigate('/')
  }

  const isComplete = digits.every(d => d !== '')

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Verify your email</h1>
        <p className="subtitle">We sent a 6-digit code to your email. Enter it below.</p>
        <form onSubmit={handleSubmit}>
          <div className="otp-inputs" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={el => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-digit"
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>
          <button type="submit" className="btn-primary" disabled={!isComplete}>
            Verify
          </button>
        </form>
        <p className="footer-link">
          Wrong email? <Link to="/signup">Go back to sign up</Link>
        </p>
      </div>
    </div>
  )
}
