import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getProduct, getImageUrl } from '../services/api'
import { useCart } from '../context/CartContext'
import ProductRecommendations from '../components/ProductRecommendations'
import './ProductDetail.css'

const SIZES = ['6', '7', '8', '9', '10', '11', '12', '13']

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [size, setSize] = useState('')
  const [added, setAdded] = useState(false)
  const [sizeError, setSizeError] = useState(false)
  const [activeImage, setActiveImage] = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setSize('')
    setAdded(false)
    getProduct(id)
      .then((p) => {
        setProduct(p)
        const extras = (p?.productImages || []).map((img) => getImageUrl(img.imageUrl ?? img.ImageUrl) || img.imageUrl || img.ImageUrl).filter(Boolean)
        const main = p?.image
        setActiveImage(main || extras[0] || null)
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [id])

  const gallery = useMemo(() => {
    if (!product) return []
    const extras = (product.productImages || []).map((img) => getImageUrl(img.imageUrl ?? img.ImageUrl) || img.imageUrl || img.ImageUrl).filter(Boolean)
    const all = [product.image, ...extras].filter(Boolean)
    return [...new Set(all)]
  }, [product])

  if (loading) return <div className="page"><p className="product-detail-loading">Loading...</p></div>
  if (!product) {
    return (
      <div className="page">
        <p>Product not found.</p>
        <button type="button" onClick={() => navigate('/shop')}>Back to shop</button>
      </div>
    )
  }

  const { name, price, description, category, stockQuantity } = product
  const outOfStock = Number(stockQuantity) === 0

  function handleAddToCart() {
    if (!size) {
      setSizeError(true)
      return
    }
    addToCart({ ...product, image: activeImage || product.image }, qty, size)
    setAdded(true)
  }

  return (
    <div className="page product-detail-page">
      <nav className="product-crumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/shop">Shop</Link>
        {category && (
          <>
            <span>/</span>
            <Link to={`/shop?category=${encodeURIComponent(String(category).toLowerCase())}`}>{category}</Link>
          </>
        )}
        <span>/</span>
        <strong>{name}</strong>
      </nav>
      <div className="product-detail">
        <div>
          <div className="product-detail-image-wrap">
            {activeImage ? (
              <img src={activeImage} alt={name} className="product-detail-image" />
            ) : (
              <div className="product-detail-placeholder">Shoe</div>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="product-thumbs">
              {gallery.map((src) => (
                <button
                  key={src}
                  type="button"
                  className={src === activeImage ? 'active' : ''}
                  onClick={() => setActiveImage(src)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-detail-info">
          {category && <span className="product-detail-category">{category}</span>}
          <h1>{name}</h1>
          {description && <p className="product-detail-desc">{description}</p>}
          <p className="product-detail-price">${Number(price).toFixed(2)}</p>
          <p className="product-stock">
            {outOfStock ? 'Currently out of stock' : 'In stock · ships within 1 business day'}
          </p>

          <div className="size-picker">
            <div className="size-picker-head">
              <span>Select US size</span>
              <Link to="/size-guide">Size guide</Link>
            </div>
            <div className="size-options">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={size === s ? 'active' : ''}
                  onClick={() => { setSize(s); setSizeError(false) }}
                >
                  {s}
                </button>
              ))}
            </div>
            {sizeError && <p className="size-error">Please choose a size to add this pair to your cart.</p>}
          </div>

          <div className="product-detail-actions">
            <label>
              Qty
              <input
                type="number"
                min={1}
                max={99}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </label>
            <button type="button" className="btn-primary" onClick={handleAddToCart} disabled={outOfStock}>
              {outOfStock ? 'Out of stock' : added ? 'Added to cart' : 'Add to cart'}
            </button>
            {added && (
              <Link to="/cart" className="btn-link">View cart</Link>
            )}
          </div>
          <ul className="product-perks">
            <li>Free shipping on orders $75+</li>
            <li>30-day returns &amp; free size exchanges</li>
            <li>Secure checkout with Stripe</li>
          </ul>
          <button type="button" className="btn-back" onClick={() => navigate(-1)}>← Back</button>
        </div>
      </div>
      <ProductRecommendations productId={id} title="You might also like" limit={4} />
    </div>
  )
}
