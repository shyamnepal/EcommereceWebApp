/**
 * Auth API – calls your .NET minimal API (auth-api).
 * Start the API with: cd auth-api && dotnet run
 * Default API URL: http://localhost:5000 (or check auth-api/Properties/launchSettings.json)
 */

const API_BASE = 'http://localhost:5000'

/**
 * Sign up – POST /api/auth/signup
 * Body: { email, name, password }
 * Returns: { success, message, user?: { id, name, email } }
 */
export async function signup(email, name, password) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Signup failed')
  }
  return data
}

/**
 * Login – POST /api/auth/login
 * Body: { email, password }
 * Returns: { success, message, token, user: { id, name, email } }
 */
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || 'Login failed')
  }
  return data
}
