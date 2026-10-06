import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getAdminOrderById, updateOrderStatus } from '../../services/api'
import { ADMIN_DASHBOARD_PATH } from '../../config'
import './OrderDetail.css'

const STATUS_OPTIONS = [
  { value: 'Pending', label: 'Pending' },
  { value: 'PaymentReceived', label: 'Paid' },
  { value: 'PaymentFailed', label: 'Payment failed' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Refunded', label: 'Refunded' },
]

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function statusLabel(s) {
  const t = (s || '').toString()
  if (t === 'PaymentReceived') return 'Paid'
  if (t === 'PaymentFailed') return 'Payment failed'
  return t.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim() || '—'
}

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')

  useEffect(() => {
    if (id) load()
  }, [id])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminOrderById(id)
      setOrder(data)
      setNewStatus(data?.status ?? data?.Status ?? '')
    } catch (e) {
      setError(e?.message ?? 'Failed to load order')
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateStatus() {
    if (!order || !newStatus || newStatus === (order.status ?? order.Status)) return
    setUpdatingStatus(true)
    try {
      await updateOrderStatus(order.orderId ?? order.OrderId, newStatus)
      setOrder((prev) => (prev ? { ...prev, status: newStatus, Status: newStatus } : null))
    } catch (e) {
      setError(e?.message ?? 'Failed to update status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="dashboard-section order-detail-page">
        <div className="order-detail-loading">
          <div className="order-loading-spinner" />
          <p>Loading order…</p>
        </div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className="dashboard-section order-detail-page">
        <div className="order-detail-error">
          <p>{error}</p>
          <Link to={`${ADMIN_DASHBOARD_PATH}/orders`} className="order-detail-back-btn">← Back to orders</Link>
        </div>
      </div>
    )
  }

  if (!order) return null

  const addr = order.shipToAddress ?? order.ShipToAddress
  const items = order.items ?? order.Items ?? []
  const orderId = order.orderId ?? order.OrderId
  const currentStatus = (order.status ?? order.Status ?? '').toLowerCase()

  return (
    <div className="dashboard-section order-detail-page">
      <nav className="order-detail-breadcrumb">
        <Link to={`${ADMIN_DASHBOARD_PATH}/orders`}>Orders</Link>
        <span className="order-detail-breadcrumb-sep">/</span>
        <span>Order #{orderId}</span>
      </nav>

      <header className="order-detail-header">
        <div className="order-detail-header-top">
          <h1>Order #{orderId}</h1>
          <span className={`order-status-badge order-status-${currentStatus}`}>
            {statusLabel(order.status ?? order.Status)}
          </span>
        </div>
        <p className="order-detail-date">{formatDate(order.orderDate ?? order.OrderDate)}</p>
        <Link to={`${ADMIN_DASHBOARD_PATH}/orders`} className="order-detail-back-link">← Back to orders</Link>
      </header>

      {error && <div className="order-detail-error-banner">{error}</div>}

      <div className="order-detail-grid">
        <section className="order-detail-block order-detail-customer">
          <h2>Customer & payment</h2>
          <dl className="order-detail-dl">
            <dt>Email</dt>
            <dd>{order.buyerEmail ?? order.BuyerEmail ?? '—'}</dd>
            <dt>Payment ID</dt>
            <dd>
              {order.paymentIntentId ?? order.PaymentIntentId ? (
                <code className="order-detail-code">{order.paymentIntentId ?? order.PaymentIntentId}</code>
              ) : (
                '—'
              )}
            </dd>
            {(order.status ?? order.Status) === 'PaymentFailed' && (order.paymentFailureReason ?? order.PaymentFailureReason) && (
              <>
                <dt>Payment failed reason</dt>
                <dd className="order-detail-payment-failure">
                  {order.paymentFailureReason ?? order.PaymentFailureReason}
                </dd>
              </>
            )}
          </dl>
          <div className="order-detail-status-update">
            <label className="order-detail-status-label">Update status</label>
            <div className="order-detail-status-row">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="order-detail-select"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <button
                type="button"
                className="order-detail-update-btn"
                disabled={updatingStatus || newStatus === (order.status ?? order.Status)}
                onClick={handleUpdateStatus}
              >
                {updatingStatus ? 'Updating…' : 'Update'}
              </button>
            </div>
          </div>
        </section>

        {addr && (
          <section className="order-detail-block">
            <h2>Shipping address</h2>
            <div className="order-detail-address">
              <p className="order-detail-address-name">
                {(addr.firstName ?? addr.FirstName ?? '')} {(addr.lastName ?? addr.LastName ?? '')}
              </p>
              <p>{addr.street ?? addr.Street ?? ''}</p>
              <p>{[addr.city ?? addr.City, addr.state ?? addr.State, addr.zipCode ?? addr.ZipCode].filter(Boolean).join(', ')}</p>
            </div>
          </section>
        )}

        <section className="order-detail-block order-detail-totals-block">
          <h2>Totals</h2>
          <dl className="order-detail-dl order-detail-totals-dl">
            <dt>Subtotal</dt>
            <dd>${Number(order.subtotal ?? order.Subtotal ?? 0).toFixed(2)}</dd>
            <dt>Delivery</dt>
            <dd>
              ${Number(order.deliveryCost ?? order.DeliveryCost ?? 0).toFixed(2)}
              {order.deliveryMethod ?? order.DeliveryMethod ? ` (${order.deliveryMethod ?? order.DeliveryMethod})` : ''}
            </dd>
            <dt className="order-detail-total-label">Total</dt>
            <dd className="order-detail-total-value">${Number(order.total ?? order.Total ?? 0).toFixed(2)}</dd>
          </dl>
        </section>
      </div>

      <section className="order-detail-block order-detail-items-block">
        <h2>Order items</h2>
        <div className="order-detail-items-wrap">
          <table className="dashboard-table order-detail-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Qty</th>
                <th className="order-detail-th-total">Line total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((line) => (
                <tr key={line.orderItemId ?? line.OrderItemId ?? line.productId ?? line.ProductId}>
                  <td className="order-detail-item-name">{line.productName ?? line.ProductName ?? '—'}</td>
                  <td>${Number(line.price ?? line.Price ?? 0).toFixed(2)}</td>
                  <td>{line.quantity ?? line.Quantity ?? 0}</td>
                  <td className="order-detail-th-total order-detail-item-total">${Number(line.lineTotal ?? line.LineTotal ?? 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
