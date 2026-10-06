import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCategories, deleteCategory } from '../../services/api'
import { ADMIN_DASHBOARD_PATH } from '../../config'
import './DashboardTable.css'
import './CategoryList.css'

export default function CategoryList() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getCategories()
      setCategories(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this category?')) return
    setDeletingId(id)
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (e) {
      setError(e.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return categories
    return categories.filter((c) =>
      [c.name, c.description].some((v) => String(v || '').toLowerCase().includes(needle))
    )
  }, [categories, q])

  return (
    <div className="dashboard-section category-page">
      <div className="dashboard-section-header">
        <div>
          <h1>Categories</h1>
          <p className="dash-subtitle">Group products so shoppers can browse by type.</p>
        </div>
        <Link to={`${ADMIN_DASHBOARD_PATH}/categories/new`} className="dash-add-btn">+ Add category</Link>
      </div>

      <div className="dash-cards">
        <div className="dash-card dash-card--violet">
          <span className="dash-card-label">Categories</span>
          <span className="dash-card-value">{categories.length}</span>
        </div>
        <div className="dash-card dash-card--blue">
          <span className="dash-card-label">With description</span>
          <span className="dash-card-value">{categories.filter((c) => c.description).length}</span>
        </div>
      </div>

      <div className="dash-toolbar">
        <div className="dash-search">
          <svg className="dash-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search categories…"
          />
        </div>
      </div>

      {error && <div className="dash-error-banner">{error}. Category API may require Admin auth.</div>}

      <div className="dash-table-card">
        <div className="dash-table-head">
          <h2>All categories</h2>
          {!loading && <span className="dash-table-count">{filtered.length} shown</span>}
        </div>

        {loading ? (
          <div className="dash-loading">
            <div className="dash-loading-spinner" />
            <p>Loading categories…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <p className="dash-empty-title">No categories found</p>
            <p className="dash-empty-text">{q ? 'Try a different search.' : 'Add a category to organize products.'}</p>
          </div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="category-name">{c.name}</div>
                    </td>
                    <td className="category-desc">{c.description || '—'}</td>
                    <td className="dashboard-actions">
                      <Link to={`${ADMIN_DASHBOARD_PATH}/categories/${c.id}/edit`} className="dashboard-btn small">Edit</Link>
                      <button
                        type="button"
                        className="dashboard-btn small danger"
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                      >
                        {deletingId === c.id ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
