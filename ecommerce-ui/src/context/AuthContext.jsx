import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { AUTH_SESSION_EXPIRED_EVENT } from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'ecommerce_token'
const USER_KEY = 'ecommerce_user'
const ADMIN_KEY = 'ecommerce_is_admin'

const ROLE_CLAIM_URI = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'

function decodeJwtPayload(token) {
  const parts = token.split('.')
  if (parts.length < 2) return null
  let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (pad) base64 += '='.repeat(4 - pad)
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  const json = new TextDecoder().decode(bytes)
  return JSON.parse(json)
}

function flattenRoles(raw) {
  if (raw == null) return []
  const list = Array.isArray(raw) ? raw : [raw]
  const roles = []
  for (const item of list) {
    if (item == null) continue
    if (Array.isArray(item)) {
      roles.push(...flattenRoles(item))
      continue
    }
    String(item)
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => roles.push(s))
  }
  return roles
}

function collectRoles(token) {
  if (!token || typeof token !== 'string') return []
  try {
    const data = decodeJwtPayload(token)
    if (!data || typeof data !== 'object') return []
    const values = [data.role, data.roles, data.Role, data.Roles, data[ROLE_CLAIM_URI]]
    for (const [key, value] of Object.entries(data)) {
      if (/role/i.test(key)) values.push(value)
    }
    return flattenRoles(values)
  } catch (_) {
    return []
  }
}

function roleIsAdmin(role) {
  const s = String(role).trim().toLowerCase()
  return s === 'admin' || s === 'administrator'
}

export function isAdminToken(token, extraRoles = []) {
  return [...collectRoles(token), ...flattenRoles(extraRoles)].some(roleIsAdmin)
}

function loadStoredAuth() {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = localStorage.getItem(USER_KEY)
    if (token) {
      const storedAdmin = localStorage.getItem(ADMIN_KEY) === '1'
      return { token, user, isAdmin: storedAdmin || isAdminToken(token) }
    }
  } catch (_) {}
  return { token: null, user: null, isAdmin: false }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(loadStoredAuth)

  useEffect(() => {
    if (auth.token) {
      localStorage.setItem(TOKEN_KEY, auth.token)
      localStorage.setItem(USER_KEY, auth.user ?? '')
      localStorage.setItem(ADMIN_KEY, auth.isAdmin ? '1' : '0')
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(ADMIN_KEY)
    }
  }, [auth.token, auth.user, auth.isAdmin])

  useEffect(() => {
    const handleSessionExpired = () => setAuth({ token: null, user: null, isAdmin: false })
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired)
  }, [])

  const login = useCallback((token, userName, extraRoles = []) => {
    setAuth({ token, user: userName, isAdmin: isAdminToken(token, extraRoles) })
  }, [])

  const logout = useCallback(() => {
    setAuth({ token: null, user: null, isAdmin: false })
  }, [])

  const value = {
    token: auth.token,
    user: auth.user,
    isAuthenticated: !!auth.token,
    isAdmin: !!auth.isAdmin,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
