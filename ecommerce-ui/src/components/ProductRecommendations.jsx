import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRecommendations, getImageUrl } from '../services/api'
import './ProductRecommendations.css'

export default function ProductRecommendations({ productId, title = 'You might also like', limit = 4 }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getRecommendations(productId, limit)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [productId, limit])

  if (loading) {
    return (
      <section className="product-recommendations">
        <h2 className="product-recommendations-title">{title}</h2>
        <div className="product-recommendations-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="product-recommendations-skeleton" />
          ))}
        </div>
      </section>
    )
  }

  if (!products.length) return null

  return (
    <section className="product-recommendations">
      <h2 className="product-recommendations-title">{title}</h2>
      <div className="product-recommendations-grid">
        {products.map((p) => {
          const imgUrl = getImageUrl(p.image) || p.image
          return (
            <Link
              key={p.id}
              to={`/product/${p.id}`}
              className="product-recommendations-card"
            >
              <div className="product-recommendations-card-image">
                {imgUrl ? (
                  <img src={imgUrl} alt={p.name} />
                ) : (
                  <div className="product-recommendations-card-placeholder">Shoe</div>
                )}
              </div>
              <div className="product-recommendations-card-body">
                <span className="product-recommendations-card-name">{p.name}</span>
                <span className="product-recommendations-card-price">
                  ${Number(p.price).toFixed(2)}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
