import { Link } from 'react-router-dom'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const { id, name, price, image, category } = product

  return (
    <article className="product-card">
      <Link to={`/product/${id}`} className="product-card-image-wrap">
        {image ? (
          <img src={image} alt={name} className="product-card-image" />
        ) : (
          <div className="product-card-placeholder">Shoe</div>
        )}
        {category && <span className="product-card-category">{category}</span>}
      </Link>
      <div className="product-card-body">
        <Link to={`/product/${id}`} className="product-card-name">{name}</Link>
        <div className="product-card-footer">
          <span className="product-card-price">${Number(price).toFixed(2)}</span>
          <Link to={`/product/${id}`} className="product-card-add">
            Select size
          </Link>
        </div>
      </div>
    </article>
  )
}
