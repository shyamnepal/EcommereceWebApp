import { useEffect, useMemo, useRef, useState } from 'react'
import { createAdminUser, deleteUser, getAdminUsers, setUserLock, setUserPassword, setUserRoles } from '../../services/api'
import './DashboardTable.css'
import './UserList.css'

function normalizeRoles(u) {
  const r = u?.roles ?? u?.Roles ?? []
  return Array.isArray(r) ? r : []
}

function isLocked(u) {
  return !!(u?.isLocked ?? u?.IsLocked)
}

function emailConfirmed(u) {
  return !!(u?.emailConfirmed ?? u?.EmailConfirmed)
}

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function avatarTone(name) {
  const tones = ['rose', 'amber', 'sky', 'violet', 'emerald', 'slate']
  const s = String(name || '')
  let n = 0
  for (let i = 0; i < s.length; i += 1) n = (n + s.charCodeAt(i)) % tones.length
  return tones[n]
}

export default function UserList() {
  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [passwordUser, setPasswordUser] = useState(null)
  const [addForm, setAddForm] = useState({ userName: '', email: '', password: '', address: '', roles: 'User' })
  const [newPassword, setNewPassword] = useState('')
  const [menuId, setMenuId] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => {
    load()
  }, [page, search])

  useEffect(() => {
    function onDocClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuId(null)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminUsers({ page, pageSize, q: search || undefined })
      const items = data?.items ?? data?.Items ?? []
      setUsers(Array.isArray(items) ? items : [])
      setTotalCount(data?.totalCount ?? data?.TotalCount ?? 0)
    } catch (e) {
      setError(e?.message ?? 'Failed to load users')
      setUsers([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const rows = useMemo(() => {
    return (users || []).map((u) => {
      const roles = normalizeRoles(u)
      const admin = roles.some((r) => String(r).toLowerCase() === 'admin')
      return {
        raw: u,
        id: u.id ?? u.Id,
        userName: u.userName ?? u.UserName ?? '—',
        email: u.email ?? u.Email ?? '—',
        roles,
        isAdmin: admin,
        isLocked: isLocked(u),
        emailConfirmed: emailConfirmed(u),
      }
    })
  }, [users])

  const stats = useMemo(() => {
    const admins = rows.filter((r) => r.isAdmin).length
    const locked = rows.filter((r) => r.isLocked).length
    const verified = rows.filter((r) => r.emailConfirmed).length
    return { admins, locked, verified }
  }, [rows])

  async function toggleLock(row) {
    if (!row?.id) return
    setBusyId(row.id)
    setMenuId(null)
    setError(null)
    try {
      const nextLocked = !row.isLocked
      await setUserLock(row.id, nextLocked)
      setUsers((prev) =>
        prev.map((u) => {
          const id = u.id ?? u.Id
          if (String(id) !== String(row.id)) return u
          return { ...u, isLocked: nextLocked, IsLocked: nextLocked }
        })
      )
    } catch (e) {
      setError(e?.message ?? 'Failed to update lock status')
    } finally {
      setBusyId(null)
    }
  }

  async function toggleAdmin(row) {
    if (!row?.id) return
    setBusyId(row.id)
    setMenuId(null)
    setError(null)
    try {
      let nextRoles = [...row.roles]
      if (row.isAdmin) {
        nextRoles = nextRoles.filter((r) => String(r).toLowerCase() !== 'admin')
      } else {
        nextRoles.push('Admin')
      }
      if (nextRoles.length === 0) nextRoles = ['User']
      const res = await setUserRoles(row.id, nextRoles)
      const rolesNow = res?.roles ?? res?.Roles ?? nextRoles
      setUsers((prev) =>
        prev.map((u) => {
          const id = u.id ?? u.Id
          if (String(id) !== String(row.id)) return u
          return { ...u, roles: rolesNow, Roles: rolesNow }
        })
      )
    } catch (e) {
      setError(e?.message ?? 'Failed to update roles')
    } finally {
      setBusyId(null)
    }
  }

  async function removeUser(row) {
    if (!row?.id) return
    setMenuId(null)
    if (!window.confirm(`Delete user "${row.userName}"? This cannot be undone.`)) return
    setBusyId(row.id)
    setError(null)
    try {
      await deleteUser(row.id)
      setUsers((prev) => prev.filter((u) => String(u.id ?? u.Id) !== String(row.id)))
      setTotalCount((c) => Math.max(0, c - 1))
    } catch (e) {
      setError(e?.message ?? 'Failed to delete user')
    } finally {
      setBusyId(null)
    }
  }

  function submitSearch(e) {
    e.preventDefault()
    setPage(1)
    setSearch(String(q || '').trim())
  }

  async function handleAddUser(e) {
    e.preventDefault()
    setError(null)
    if (!addForm.userName?.trim() || !addForm.email?.trim() || !addForm.password) {
      setError('Username, email, and password are required.')
      return
    }
    if (addForm.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setBusyId('__add__')
    try {
      const roles = addForm.roles
        ? addForm.roles.split(/[\s,]+/).map((r) => r.trim()).filter(Boolean)
        : ['User']
      await createAdminUser({
        userName: addForm.userName.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        address: addForm.address.trim() || undefined,
        roles: roles.length ? roles : ['User'],
      })
      setShowAddModal(false)
      setAddForm({ userName: '', email: '', password: '', address: '', roles: 'User' })
      load()
    } catch (e) {
      setError(e?.message ?? 'Failed to create user')
    } finally {
      setBusyId(null)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (!passwordUser || !newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setError(null)
    setBusyId(passwordUser.id)
    try {
      await setUserPassword(passwordUser.id, newPassword)
      setPasswordUser(null)
      setNewPassword('')
    } catch (e) {
      setError(e?.message ?? 'Failed to change password')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="dashboard-section user-list-page">
      <header className="user-page-header">
        <div>
          <h1>Users</h1>
          <p className="user-page-subtitle">Manage accounts, roles, and access for your store.</p>
        </div>
        <button type="button" className="user-add-btn" onClick={() => { setShowAddModal(true); setError(null) }}>
          <span className="user-add-btn-icon">+</span>
          Add user
        </button>
      </header>

      <div className="user-summary-cards">
        <div className="user-summary-card user-summary-card--total">
          <span className="user-summary-label">Total users</span>
          <span className="user-summary-value">{totalCount}</span>
        </div>
        <div className="user-summary-card user-summary-card--admin">
          <span className="user-summary-label">Admins</span>
          <span className="user-summary-value">{stats.admins}</span>
          <span className="user-summary-meta">On this page</span>
        </div>
        <div className="user-summary-card user-summary-card--active">
          <span className="user-summary-label">Verified</span>
          <span className="user-summary-value">{stats.verified}</span>
          <span className="user-summary-meta">On this page</span>
        </div>
        <div className="user-summary-card user-summary-card--locked">
          <span className="user-summary-label">Locked</span>
          <span className="user-summary-value">{stats.locked}</span>
          <span className="user-summary-meta">On this page</span>
        </div>
      </div>

      <form className="user-toolbar" onSubmit={submitSearch}>
        <div className="user-search">
          <svg className="user-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by username or email…"
            className="user-search-input"
          />
        </div>
        <button type="submit" className="dashboard-btn primary">Search</button>
        <button
          type="button"
          className="dashboard-btn"
          onClick={() => { setQ(''); setSearch(''); setPage(1) }}
          disabled={!q && !search}
        >
          Clear
        </button>
      </form>

      {error && <div className="user-error-banner">{error}</div>}

      <div className="user-table-card">
        <div className="user-table-header">
          <h2>All users</h2>
          {!loading && (
            <span className="user-table-count">
              {totalCount} account{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="user-loading">
            <div className="user-loading-spinner" />
            <p>Loading users…</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="user-empty">
            <div className="user-empty-icon">👥</div>
            <p className="user-empty-title">No users found</p>
            <p className="user-empty-text">Try a different search, or add a new account.</p>
          </div>
        ) : (
          <>
            <div className="user-table-wrap">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Roles</th>
                    <th>Verified</th>
                    <th>Status</th>
                    <th className="user-col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className={row.isLocked ? 'user-row--locked' : ''}>
                      <td>
                        <div className="user-identity">
                          <span className={`user-avatar user-avatar--${avatarTone(row.userName)}`} aria-hidden="true">
                            {initials(row.userName)}
                          </span>
                          <div className="user-identity-text">
                            <div className="user-name">{row.userName}</div>
                            <div className="user-email">{row.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="user-role-pills">
                          {(row.roles.length ? row.roles : ['User']).map((role) => (
                            <span
                              key={role}
                              className={`user-role-pill ${String(role).toLowerCase() === 'admin' ? 'user-role-pill--admin' : ''}`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className={`user-badge ${row.emailConfirmed ? 'user-badge--ok' : 'user-badge--muted'}`}>
                          {row.emailConfirmed ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>
                        <span className={`user-badge ${row.isLocked ? 'user-badge--locked' : 'user-badge--active'}`}>
                          {row.isLocked ? 'Locked' : 'Active'}
                        </span>
                      </td>
                      <td className="user-col-actions">
                        <div className="user-menu" ref={menuId === row.id ? menuRef : null}>
                          <button
                            type="button"
                            className="user-menu-btn"
                            aria-label={`Actions for ${row.userName}`}
                            disabled={busyId === row.id}
                            onClick={() => setMenuId((id) => (id === row.id ? null : row.id))}
                          >
                            {busyId === row.id ? '…' : '⋯'}
                          </button>
                          {menuId === row.id && (
                            <div className="user-menu-dropdown">
                              <button type="button" onClick={() => toggleLock(row)}>
                                {row.isLocked ? 'Unlock account' : 'Lock account'}
                              </button>
                              <button type="button" onClick={() => toggleAdmin(row)}>
                                {row.isAdmin ? 'Revoke admin' : 'Make admin'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPasswordUser(row)
                                  setNewPassword('')
                                  setError(null)
                                  setMenuId(null)
                                }}
                              >
                                Change password
                              </button>
                              <button type="button" className="user-menu-danger" onClick={() => removeUser(row)}>
                                Delete user
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalCount > pageSize && (
              <div className="user-pagination">
                <button type="button" className="user-pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <span className="user-pagination-info">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <button type="button" className="user-pagination-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showAddModal && (
        <div className="user-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add user</h2>
            <p className="user-modal-lead">Create an account and choose a role.</p>
            <form onSubmit={handleAddUser} className="user-form">
              <label>
                Username <span className="required">*</span>
                <input
                  value={addForm.userName}
                  onChange={(e) => setAddForm((f) => ({ ...f, userName: e.target.value }))}
                  placeholder="e.g. john"
                  required
                  minLength={2}
                  autoComplete="username"
                />
              </label>
              <label>
                Email <span className="required">*</span>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. john@example.com"
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Password <span className="required">*</span>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              <label>
                Address
                <input
                  value={addForm.address}
                  onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Optional"
                />
              </label>
              <label>
                Role
                <select
                  value={addForm.roles}
                  onChange={(e) => setAddForm((f) => ({ ...f, roles: e.target.value }))}
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="User,Admin">User &amp; Admin</option>
                </select>
              </label>
              <div className="user-modal-actions">
                <button type="button" className="dashboard-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="dashboard-btn primary" disabled={busyId === '__add__'}>
                  {busyId === '__add__' ? 'Creating…' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordUser && (
        <div className="user-modal-overlay" onClick={() => setPasswordUser(null)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Change password</h2>
            <p className="user-modal-lead">Set a new password for <strong>{passwordUser.userName}</strong>.</p>
            <form onSubmit={handleChangePassword} className="user-form">
              <label>
                New password <span className="required">*</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </label>
              <div className="user-modal-actions">
                <button type="button" className="dashboard-btn" onClick={() => setPasswordUser(null)}>Cancel</button>
                <button type="submit" className="dashboard-btn primary" disabled={busyId === passwordUser.id}>
                  {busyId === passwordUser.id ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
