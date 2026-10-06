import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import './Cart.css'

export default function Cart() {
  const { items, totalItems, totalPrice, removeFromCart, updateQuantity } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  async function handleProceedToCheckout() {
    if (items.length === 0) return
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent('/cart'))
      return
    }
    navigate('/checkout')
  }

  if (items.length === 0) {
    return (
      <div className="page cart-page">
        <div className="cart-empty">
          <h2>Your cart is empty</h2>
          <p>Find a pair, pick a size, and we’ll hold it here until you’re ready.</p>
          <Link to="/shop" className="cart-shop-link">Continue shopping</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page cart-page">
      <div className="cart-container">
        <h1>Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})</h1>
        <ul className="cart-list">
          {items.map((item) => (
            <li key={item.lineKey} className="cart-item">
              <div className="cart-item-image">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <div className="cart-item-placeholder">Shoe</div>
                )}
              </div>
              <div className="cart-item-details">
                <h3>{item.name}</h3>
                {item.size && <p className="cart-item-size">US size {item.size}</p>}
                <p className="cart-item-price">${Number(item.price).toFixed(2)}</p>
                <div className="cart-item-actions">
                  <label>
                    Qty
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.lineKey, Math.max(1, parseInt(e.target.value, 10) || 1))}
                    />
                  </label>
                  <button type="button" className="cart-remove" onClick={() => removeFromCart(item.lineKey)}>
                    Remove
                  </button>
                </div>
              </div>
              <div className="cart-item-total">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </li>
          ))}
        </ul>
        <div className="cart-summary">
          {!isAuthenticated && (
            <p className="cart-login-prompt">Please <Link to="/login?redirect=%2Fcart">sign in</Link> to proceed to checkout.</p>
          )}
          <p className="cart-ship-note">
            {totalPrice >= 75
              ? 'You’ve unlocked free standard shipping.'
              : `Add $${(75 - totalPrice).toFixed(2)} more for free shipping.`}
          </p>
          <p className="cart-total"><strong>Total: ${totalPrice.toFixed(2)}</strong></p>
          <Link to="/shop" className="cart-continue">Continue shopping</Link>
          <button
            type="button"
            className="cart-checkout"
            onClick={handleProceedToCheckout}
          >
            {isAuthenticated ? 'Proceed to checkout' : 'Sign in to checkout'}
          </button>
        </div>
      </div>
    </div>
  )
}
