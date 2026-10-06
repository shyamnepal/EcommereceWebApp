import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts, deleteProduct, getImageUrl } from '../../services/api'
import { ADMIN_DASHBOARD_PATH } from '../../config'
import './DashboardTable.css'
import './ProductList.css'

function stockBadge(qty) {
  const n = Number(qty)
  if (!Number.isFinite(n)) return { label: '—', cls: 'dash-badge--muted' }
  if (n <= 0) return { label: 'Out of stock', cls: 'dash-badge--bad' }
  if (n <= 5) return { label: `Low · ${n}`, cls: 'dash-badge--warn' }
  return { label: `In stock · ${n}`, cls: 'dash-badge--ok' }
}

export default function ProductList() {
  const [products, setProducts] = useState([])
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
      const data = await getProducts('')
      setProducts(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return
    setDeletingId(id)
    try {
      await deleteProduct(id)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      setError(e.message)
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return products
    return products.filter((p) =>
      [p.name, p.category, p.description].some((v) => String(v || '').toLowerCase().includes(needle))
    )
  }, [products, q])

  const stats = useMemo(() => {
    const total = products.length
    let inStock = 0
    let low = 0
    let out = 0
    for (const p of products) {
      const n = Number(p.stockQuantity)
      if (!Number.isFinite(n) || n > 5) inStock += 1
      else if (n <= 0) out += 1
      else low += 1
    }
    return { total, inStock, low, out }
  }, [products])

  return (
    <div className="dashboard-section">
      <div className="dashboard-section-header">
        <div>
          <h1>Shoes</h1>
          <p className="dash-subtitle">Catalog, pricing, and stock for every product.</p>
        </div>
        <Link to={`${ADMIN_DASHBOARD_PATH}/products/new`} className="dash-add-btn">+ Add shoes</Link>
      </div>

      <div className="dash-cards">
        <div className="dash-card dash-card--blue">
          <span className="dash-card-label">Products</span>
          <span className="dash-card-value">{stats.total}</span>
        </div>
        <div className="dash-card dash-card--green">
          <span className="dash-card-label">In stock</span>
          <span className="dash-card-value">{stats.inStock}</span>
        </div>
        <div className="dash-card dash-card--amber">
          <span className="dash-card-label">Low stock</span>
          <span className="dash-card-value">{stats.low}</span>
        </div>
        <div className="dash-card dash-card--red">
          <span className="dash-card-label">Out of stock</span>
          <span className="dash-card-value">{stats.out}</span>
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
            placeholder="Search name or category…"
          />
        </div>
      </div>

      {error && <div className="dash-error-banner">{error}</div>}

      <div className="dash-table-card">
        <div className="dash-table-head">
          <h2>Product catalog</h2>
          {!loading && <span className="dash-table-count">{filtered.length} shown</span>}
        </div>

        {loading ? (
          <div className="dash-loading">
            <div className="dash-loading-spinner" />
            <p>Loading products…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="dash-empty">
            <p className="dash-empty-title">No products found</p>
            <p className="dash-empty-text">{q ? 'Try a different search.' : 'Add shoes to start your catalog.'}</p>
          </div>
        ) : (
          <div className="dashboard-table-wrap">
            <table className="dashboard-table product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const stock = stockBadge(p.stockQuantity)
                  const img = getImageUrl(p.image) || p.image
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="product-identity">
                          {img ? (
                            <img className="product-thumb" src={img} alt="" />
                          ) : (
                            <span className="product-thumb product-thumb--empty">No img</span>
                          )}
                          <div>
                            <div className="product-name">{p.name}</div>
                            {p.description && <div className="product-desc">{p.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="dash-badge dash-badge--muted">{p.category ?? 'Uncategorized'}</span>
                      </td>
                      <td className="product-price">${Number(p.price).toFixed(2)}</td>
                      <td>
                        <span className={`dash-badge ${stock.cls}`}>{stock.label}</span>
                      </td>
                      <td className="dashboard-actions">
                        <Link to={`${ADMIN_DASHBOARD_PATH}/products/${p.id}/edit`} className="dashboard-btn small">Edit</Link>
                        <button
                          type="button"
                          className="dashboard-btn small danger"
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                        >
                          {deletingId === p.id ? '…' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
