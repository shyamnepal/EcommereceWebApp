import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import {
  createOrder,
  confirmPayment,
  getStripePublishableKey,
  getDeliveryMethods,
  getLastShippingAddress,
} from '../services/api'
import './Checkout.css'

// Matches OrderDto.ShipToAddress (Address: FirstName, LastName, Street, City, State, ZipCode)
const initialAddress = {
  firstName: '',
  lastName: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
}

/**
 * Map Stripe payment errors to clear, user-facing messages.
 * Uses error.code and error.decline_code from Stripe (card_declined, insufficient_funds, etc.).
 */
function getStripePaymentErrorMessage(stripeError) {
  if (!stripeError) return 'Payment failed. Please try again.'
  const code = (stripeError.code || '').toLowerCase()
  const declineCode = (stripeError.decline_code || '').toLowerCase()
  const c = declineCode || code

  const messages = {
    // Card declined
    card_declined: 'Your card was declined.',
    generic_decline: 'Your card was declined. Try another card or contact your bank.',
    do_not_honor: 'Your card was declined. Please contact your bank.',
    do_not_try_again: 'Your card was declined. Do not try again without contacting your bank.',
    // Insufficient funds
    insufficient_funds: 'Insufficient funds. Please use a different card or add funds to your account.',
    // Lost / stolen / fraud
    lost_card: 'This card has been reported lost. Please use a different card.',
    stolen_card: 'This card has been reported stolen. Please use a different card.',
    fraudulent: 'This payment was declined due to suspected fraud. Please use a different card.',
    // Card details
    expired_card: 'Your card has expired. Please use a different card.',
    incorrect_cvc: 'The security code (CVC) is incorrect. Please check and try again.',
    invalid_cvc: 'The security code (CVC) is invalid. Please check and try again.',
    incorrect_number: 'The card number is incorrect. Please check and try again.',
    invalid_number: 'The card number is invalid. Please check and try again.',
    invalid_expiry_month: 'The card expiration month is invalid.',
    invalid_expiry_year: 'The card expiration year is invalid.',
    // Authentication
    authentication_required: 'This card requires extra verification. Please try again and complete the verification step.',
    // Processing / limits
    processing_error: 'A processing error occurred. Please try again in a moment.',
    rate_limit_error: 'Too many requests. Please wait a moment and try again.',
    card_velocity_exceeded: 'You have exceeded the limit for this card. Please try again later or use another card.',
    duplicate_transaction: 'This transaction was already submitted. If you were charged, check your orders.',
    call_issuer: 'Your card was declined. Please contact your card issuer.',
    pickup_card: 'Your card has been restricted. Please contact your bank.',
    restricted_card: 'This card cannot be used for this payment. Please use a different card.',
    invalid_account: 'The card account is invalid. Please use a different card.',
    currency_not_supported: 'This card does not support the payment currency.',
  }
  const msg = messages[c]
  if (msg) return msg
  // Fallback: use Stripe's message or generic
  return stripeError.message || 'Payment failed. Please check your card details and try again.'
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const [address, setAddress] = useState(initialAddress)
  const [deliveryMethods, setDeliveryMethods] = useState([])
  const [deliveryMethodId, setDeliveryMethodId] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [stripeReady, setStripeReady] = useState(false)
  const cardNumberRef = useRef(null)
  const cardExpiryRef = useRef(null)
  const cardCvcRef = useRef(null)
  const stripeRef = useRef(null)
  const elementsRef = useRef(null)
  const cardNumberElementRef = useRef(null)
  const cardExpiryElementRef = useRef(null)
  const cardCvcElementRef = useRef(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=' + encodeURIComponent('/checkout'))
      return
    }
    if (items.length === 0 && !paymentSuccess) {
      navigate('/cart')
      return
    }
    getDeliveryMethods()
      .then((list) => {
        setDeliveryMethods(list)
        if (list.length > 0) {
          const first = list[0]
          setDeliveryMethodId(first?.deliveryMethodId ?? first?.DeliveryMethodId ?? 1)
        }
      })
      .catch(() => {})
  }, [isAuthenticated, items.length, navigate, paymentSuccess])

  // If user has a saved address (from last order), pre-fill the form; otherwise leave empty so they can add manually
  useEffect(() => {
    if (!isAuthenticated) return
    getLastShippingAddress()
      .then((saved) => {
        if (!saved) return
        const fn = saved.firstName ?? saved.FirstName ?? ''
        const ln = saved.lastName ?? saved.LastName ?? ''
        const st = saved.street ?? saved.Street ?? ''
        const ci = saved.city ?? saved.City ?? ''
        const sta = saved.state ?? saved.State ?? ''
        const zip = saved.zipCode ?? saved.ZipCode ?? ''
        if (fn || ln || st || ci || zip) {
          setAddress({
            firstName: fn,
            lastName: ln,
            street: st,
            city: ci,
            state: sta,
            zipCode: zip,
          })
        }
      })
      .catch(() => {})
  }, [isAuthenticated])

  // Load Stripe and mount separate card elements (number, expiry, CVV) so all fields are visible and accept input
  useEffect(() => {
    if (!cardNumberRef.current || !cardExpiryRef.current || !cardCvcRef.current) return
    let mounted = true
    getStripePublishableKey().then((key) => {
      if (!mounted || !key) return
      loadStripe(key).then((stripe) => {
        if (!mounted || !stripe || !cardNumberRef.current || !cardExpiryRef.current || !cardCvcRef.current) return
        stripeRef.current = stripe
        const elements = stripe.elements()
        elementsRef.current = elements
        const style = { base: { fontSize: '16px', color: '#1e293b' } }
        const cardNumber = elements.create('cardNumber', { style })
        const cardExpiry = elements.create('cardExpiry', { style })
        const cardCvc = elements.create('cardCvc', { style })
        cardNumberElementRef.current = cardNumber
        cardExpiryElementRef.current = cardExpiry
        cardCvcElementRef.current = cardCvc
        cardNumber.mount(cardNumberRef.current)
        cardExpiry.mount(cardExpiryRef.current)
        cardCvc.mount(cardCvcRef.current)
        setStripeReady(true)
      })
    })
    return () => {
      mounted = false
      try {
        if (cardNumberElementRef.current) cardNumberElementRef.current.destroy()
        if (cardExpiryElementRef.current) cardExpiryElementRef.current.destroy()
        if (cardCvcElementRef.current) cardCvcElementRef.current.destroy()
      } catch (_) {}
      cardNumberElementRef.current = null
      cardExpiryElementRef.current = null
      cardCvcElementRef.current = null
      setStripeReady(false)
    }
  }, [])

  async function handlePay(e) {
    e?.preventDefault()
    setError(null)

    const { firstName, lastName, street, city, state, zipCode } = address
    if (!firstName?.trim() || !lastName?.trim() || !street?.trim() || !city?.trim() || !zipCode?.trim()) {
      setError('Please fill in all required address fields (First name, Last name, Street, City, ZIP code).')
      return
    }
    if (!stripeRef.current || !cardNumberElementRef.current) {
      setError('Payment form is not ready. Please wait a moment and try again.')
      return
    }

    setLoading(true)

    try {
      // Create order from cart items (no Redis – cart is in localStorage). API returns clientSecret for Stripe.
      const order = await createOrder({
        items: items.map((i) => ({
          productId: i.id,
          productName: i.size ? `${i.name} (US ${i.size})` : i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        deliverMethodId: deliveryMethodId,
        shipToAddress: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          street: street.trim(),
          city: city.trim(),
          state: (state || '').trim(),
          zipCode: String(zipCode).trim(),
        },
        buyerEmail: user?.email ?? undefined,
      })
      const clientSecret = order?.clientSecret ?? order?.ClientSecret
      const oid = order?.orderId ?? order?.OrderId
      const paymentIntentId = order?.paymentIntentId ?? order?.PaymentIntentId
      if (!clientSecret) {
        setError('Could not start payment. Missing client secret from server.')
        setLoading(false)
        return
      }

      // 3. Confirm card payment with Stripe (pass card number element; expiry and CVC are linked).
      const { error: stripeError } = await stripeRef.current.confirmCardPayment(clientSecret, {
        payment_method: { card: cardNumberElementRef.current },
      })
      if (stripeError) {
        setError(getStripePaymentErrorMessage(stripeError))
        setLoading(false)
        return
      }

      // 4. Mark order as paid on our server (so status shows PaymentReceived even if webhook is not reachable).
      if (paymentIntentId) {
        try {
          await confirmPayment(paymentIntentId)
        } catch (_) {
          // Non-blocking: webhook may still update; order is already placed.
        }
      }

      setOrderId(oid)
      setPaymentSuccess(true)
      clearCart()
    } catch (err) {
      setError(err?.message || 'Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (paymentSuccess) {
    return (
      <div className="page checkout-page">
        <div className="checkout-success">
          <h1>Thank you for your order</h1>
          <p>Your payment was successful. Order #{orderId ?? '—'} has been placed.</p>
          <p className="checkout-success-note">Your order status has been updated to Paid.</p>
          <button type="button" className="checkout-btn-primary" onClick={() => navigate('/shop')}>
            Continue shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page checkout-page">
      <div className="checkout-container">
        <h1>Checkout</h1>
        {error && <div className="checkout-error">{error}</div>}

        <form onSubmit={handlePay} className="checkout-form">
          {/* Order summary */}
          <section className="checkout-section">
            <h2>Order summary</h2>
            <ul className="checkout-summary-list">
              {items.map((item) => (
                <li key={item.lineKey || item.id} className="checkout-summary-item">
                  <span>{item.name}{item.size ? ` · US ${item.size}` : ''} × {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <p className="checkout-total">Total: ${totalPrice.toFixed(2)}</p>
          </section>

          {/* Shipping address – matches OrderDto.ShipToAddress (Address) */}
          <section className="checkout-section">
            <h2>Shipping address</h2>
            <div className="checkout-form-grid">
              <label>
                First name *
                <input
                  value={address.firstName}
                  onChange={(e) => setAddress((a) => ({ ...a, firstName: e.target.value }))}
                  placeholder="First name"
                  required
                />
              </label>
              <label>
                Last name *
                <input
                  value={address.lastName}
                  onChange={(e) => setAddress((a) => ({ ...a, lastName: e.target.value }))}
                  placeholder="Last name"
                  required
                />
              </label>
              <label className="checkout-form-full">
                Street *
                <input
                  value={address.street}
                  onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
                  placeholder="Street address"
                  required
                />
              </label>
              <label>
                City *
                <input
                  value={address.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                  placeholder="City"
                  required
                />
              </label>
              <label>
                State
                <input
                  value={address.state}
                  onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                  placeholder="State"
                />
              </label>
              <label>
                ZIP code *
                <input
                  value={address.zipCode}
                  onChange={(e) => setAddress((a) => ({ ...a, zipCode: e.target.value }))}
                  placeholder="ZIP code"
                  required
                />
              </label>
            </div>
          </section>

          {/* Delivery method */}
          {deliveryMethods.length > 0 && (
            <section className="checkout-section">
              <h2>Delivery</h2>
              <label>
                <select
                  value={deliveryMethodId}
                  onChange={(e) => setDeliveryMethodId(Number(e.target.value))}
                >
                  {deliveryMethods.map((d) => (
                    <option key={d.deliveryMethodId ?? d.id} value={d.deliveryMethodId ?? d.id}>
                      {d.shortName ?? d.ShortName} — ${Number(d.price ?? d.Price ?? 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </label>
            </section>
          )}

          {/* Card information (Stripe) – separate fields for number, expiry, CVV */}
          <section className="checkout-section">
            <h2>Card information</h2>
            <p className="checkout-card-hint">Payment is processed securely by Stripe.</p>
            <label className="checkout-card-label">Card number</label>
            <div className="checkout-card-element" ref={cardNumberRef} />
            <div className="checkout-card-row">
              <div className="checkout-card-field">
                <label className="checkout-card-label">Expiry date</label>
                <div className="checkout-card-element checkout-card-element-small" ref={cardExpiryRef} />
              </div>
              <div className="checkout-card-field">
                <label className="checkout-card-label">CVC</label>
                <div className="checkout-card-element checkout-card-element-small" ref={cardCvcRef} />
              </div>
            </div>
            {!stripeReady && <p className="checkout-loading-card">Loading payment form…</p>}
          </section>

          <button
            type="submit"
            className="checkout-btn-primary checkout-btn-pay"
            disabled={loading || !stripeReady}
          >
            {loading ? 'Processing payment…' : 'Pay now'}
          </button>
        </form>
      </div>
    </div>
  )
}
