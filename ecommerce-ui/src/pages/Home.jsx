import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getProducts, getCategories } from '../services/api'
import ProductCard from '../components/ProductCard'
import './Home.css'

const TRUST = [
  { title: 'Free shipping $75+', text: 'Standard delivery on qualifying orders.' },
  { title: '30-day returns', text: 'Try them on at home. Easy exchanges.' },
  { title: 'True-to-size fit', text: 'Use our size guide before you buy.' },
  { title: 'Secure checkout', text: 'Card payments processed by Stripe.' },
]

const REVIEWS = [
  { name: 'Maya R.', quote: 'Finally a daily sneaker that doesn’t wreck my commute. True to size and the cushioning lasts.' },
  { name: 'Jordan P.', quote: 'Ordered Friday, wearing them Sunday. Box, packing, and the pair all felt like a real shop.' },
  { name: 'Elena K.', quote: 'Exchanged a size in two days. Support actually answered like a person.' },
]

export default function Home() {
  const [featured, setFeatured] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    getProducts('').then((list) => setFeatured(Array.isArray(list) ? list : [])).catch(() => setFeatured([]))
    getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  return (
    <div className="page home-page">
      <section className="hero">
        <p className="hero-kicker">New season · Everyday wear</p>
        <h1>Shoes you’ll actually live in</h1>
        <p>Comfort-first sneakers and boots, honest sizing, and shipping that doesn’t keep you waiting.</p>
        <div className="hero-actions">
          <Link to="/shop?category=shoes" className="hero-cta">Shop shoes</Link>
          <Link to="/size-guide" className="hero-cta-ghost">Find your size</Link>
        </div>
      </section>

      <section className="trust-row">
        {TRUST.map((item) => (
          <article key={item.title} className="trust-card">
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      {categories.length > 0 && (
        <section className="collections">
          <div className="section-head">
            <h2>Shop by collection</h2>
            <Link to="/shop" className="see-all">All products →</Link>
          </div>
          <div className="collection-grid">
            {categories.slice(0, 4).map((c) => (
              <Link key={c.id} to={`/shop?category=${encodeURIComponent((c.name || '').toLowerCase())}`} className="collection-card">
                <span>{c.name}</span>
                <em>Shop now</em>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="featured">
        <div className="section-head">
          <h2>Bestsellers</h2>
          <Link to="/shop" className="see-all">View all →</Link>
        </div>
        <div className="product-grid">
          {featured.slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="how-row">
        <h2>How SoleStore works</h2>
        <div className="how-grid">
          <article>
            <span>1</span>
            <h3>Pick a pair</h3>
            <p>Filter by category and check the size guide. Most styles run true to size.</p>
          </article>
          <article>
            <span>2</span>
            <h3>Checkout securely</h3>
            <p>Pay with card. You’ll get an order confirmation right away.</p>
          </article>
          <article>
            <span>3</span>
            <h3>Wear or swap</h3>
            <p>Try them indoors. Need another size? Free exchanges within 30 days.</p>
          </article>
        </div>
      </section>

      <section className="reviews">
        <h2>What customers say</h2>
        <div className="review-grid">
          {REVIEWS.map((r) => (
            <blockquote key={r.name} className="review-card">
              <p>“{r.quote}”</p>
              <cite>{r.name}</cite>
            </blockquote>
          ))}
        </div>
      </section>
    </div>
  )
}
