import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getProducts, getCategories } from '../services/api'
import ProductCard from '../components/ProductCard'
import './Shop.css'

export default function Shop() {
  const [searchParams] = useSearchParams()
  const categoryParam = searchParams.get('category') || ''
  const qParam = searchParams.get('q') || ''
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sort, setSort] = useState('featured')

  useEffect(() => {
    setLoading(true)
    const category = categoryParam.toLowerCase() || ''
    Promise.all([
      getProducts(category),
      getCategories(),
    ])
      .then(([prods, cats]) => {
        setProducts(Array.isArray(prods) ? prods : [])
        setCategories(Array.isArray(cats) ? cats : [])
      })
      .catch(() => {
        setProducts([])
        setCategories([])
      })
      .finally(() => setLoading(false))
  }, [categoryParam])

  const closeSidebar = () => setSidebarOpen(false)

  const displayed = useMemo(() => {
    const needle = qParam.trim().toLowerCase()
    let list = products
    if (needle) {
      list = list.filter((p) =>
        [p.name, p.category, p.description].some((v) => String(v || '').toLowerCase().includes(needle))
      )
    }
    const copy = [...list]
    if (sort === 'price-asc') copy.sort((a, b) => Number(a.price) - Number(b.price))
    if (sort === 'price-desc') copy.sort((a, b) => Number(b.price) - Number(a.price))
    if (sort === 'name') copy.sort((a, b) => String(a.name).localeCompare(String(b.name)))
    return copy
  }, [products, qParam, sort])

  const pageTitle = qParam
    ? `Results for “${qParam}”`
    : categoryParam
      ? `${categoryParam.charAt(0).toUpperCase() + categoryParam.slice(1)}`
      : 'All Products'

  return (
    <div className="shop-page">
      <div className="shop-layout">
        <button
          type="button"
          className="shop-filter-toggle"
          onClick={() => setSidebarOpen((o) => !o)}
          aria-label="Toggle categories"
          aria-expanded={sidebarOpen}
        >
          <span className="shop-filter-toggle-icon" aria-hidden>
            {sidebarOpen ? '✕' : '☰'}
          </span>
          <span>Categories</span>
        </button>

        <aside className={`shop-sidebar ${sidebarOpen ? 'shop-sidebar-open' : ''}`} aria-label="Product categories">
          <div className="shop-sidebar-header">
            <h2 className="shop-sidebar-title">Categories</h2>
            <button type="button" className="shop-sidebar-close" onClick={closeSidebar} aria-label="Close menu">
              ✕
            </button>
          </div>
          <nav className="shop-sidebar-nav">
            <Link to="/shop" className={!categoryParam ? 'active' : ''} onClick={closeSidebar}>
              All Products
            </Link>
            {categories.map((c) => {
              const key = (c.name || '').toLowerCase()
              const isActive = categoryParam === key
              return (
                <Link
                  key={c.id}
                  to={`/shop?category=${encodeURIComponent(key)}`}
                  className={isActive ? 'active' : ''}
                  onClick={closeSidebar}
                >
                  {c.name}
                </Link>
              )
            })}
          </nav>
        </aside>

        <div className="shop-overlay" aria-hidden={!sidebarOpen} onClick={closeSidebar} />

        <main className="shop-main">
          <header className="shop-main-header">
            <div>
              <h1 className="shop-main-title">{pageTitle}</h1>
              {!loading && (
                <p className="shop-main-count">
                  {displayed.length} {displayed.length === 1 ? 'product' : 'products'}
                </p>
              )}
            </div>
            <label className="shop-sort">
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name">Name</option>
              </select>
            </label>
          </header>

          {loading ? (
            <div className="shop-loading">
              <div className="shop-loading-spinner" aria-hidden />
              <p>Loading products…</p>
            </div>
          ) : displayed.length === 0 ? (
            <div className="shop-empty">
              <p>No products match this search.</p>
              <Link to="/shop" className="shop-empty-link">View all products</Link>
            </div>
          ) : (
            <div className="shop-grid">
              {displayed.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
