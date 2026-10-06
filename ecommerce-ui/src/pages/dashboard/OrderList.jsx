import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminOrders, getDashboardSummary } from '../../services/api'
import { ADMIN_DASHBOARD_PATH } from '../../config'
import './DashboardTable.css'
import './OrderList.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
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
  const date = new Date(d)
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusLabel(s) {
  const t = (s || '').toString()
  if (t === 'PaymentReceived') return 'Paid'
  if (t === 'PaymentFailed') return 'Payment failed'
  return t.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim() || '—'
}

export default function OrderList() {
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSummary()
  }, [])

  useEffect(() => {
    loadOrders()
  }, [page, dateFrom, dateTo, status])

  async function loadSummary() {
    try {
      const data = await getDashboardSummary()
      setSummary(data)
    } catch (_) {}
  }

  async function loadOrders() {
    setLoading(true)
    setError(null)
    try {
      const params = { page, pageSize }
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      if (status) params.status = status
      const data = await getAdminOrders(params)
      const items = data?.items ?? data?.Items ?? []
      setOrders(Array.isArray(items) ? items : [])
      setTotalCount(data?.totalCount ?? data?.TotalCount ?? 0)
    } catch (e) {
      setError(e?.message ?? 'Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const orderId = (o) => o.orderId ?? o.OrderId

  return (
    <div className="dashboard-section order-list-page">
      <header className="order-page-header">
        <h1>Orders</h1>
        <p className="order-page-subtitle">Manage orders, view revenue and filter by date or status.</p>
      </header>

      {summary && (
        <div className="order-summary-cards">
          <div className="order-summary-card order-summary-card--revenue">
            <span className="order-summary-label">Total revenue</span>
            <span className="order-summary-value">${Number(summary.totalRevenue ?? 0).toFixed(2)}</span>
          </div>
          <div className="order-summary-card order-summary-card--orders">
            <span className="order-summary-label">Total orders</span>
            <span className="order-summary-value">{summary.totalOrders ?? 0}</span>
          </div>
          <div className="order-summary-card order-summary-card--today">
            <span className="order-summary-label">Today</span>
            <span className="order-summary-value">${Number(summary.revenueToday ?? 0).toFixed(2)}</span>
            <span className="order-summary-meta">{summary.ordersToday ?? 0} orders</span>
          </div>
          <div className="order-summary-card order-summary-card--week">
            <span className="order-summary-label">This week</span>
            <span className="order-summary-value">${Number(summary.revenueThisWeek ?? 0).toFixed(2)}</span>
            <span className="order-summary-meta">{summary.ordersThisWeek ?? 0} orders</span>
          </div>
          <div className="order-summary-card order-summary-card--month">
            <span className="order-summary-label">This month</span>
            <span className="order-summary-value">${Number(summary.revenueThisMonth ?? 0).toFixed(2)}</span>
            <span className="order-summary-meta">{summary.ordersThisMonth ?? 0} orders</span>
          </div>
        </div>
      )}

      <div className="order-filters-card">
        <h2 className="order-filters-title">Filter orders</h2>
        <div className="order-filters">
          <label className="order-filter-group">
            <span className="order-filter-label">From date</span>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="order-filter-input" />
          </label>
          <label className="order-filter-group">
            <span className="order-filter-label">To date</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="order-filter-input" />
          </label>
          <label className="order-filter-group">
            <span className="order-filter-label">Status</span>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="order-filter-input">
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </label>
          <button type="button" className="order-filter-clear" onClick={() => { setDateFrom(''); setDateTo(''); setStatus(''); setPage(1); loadOrders(); loadSummary(); }}>
            Clear filters
          </button>
        </div>
      </div>

      {error && <div className="order-error-banner">{error}</div>}

      <div className="order-table-card">
        <div className="order-table-header">
          <h2>Order list</h2>
          {!loading && totalCount > 0 && (
            <span className="order-table-count">{totalCount} order{totalCount !== 1 ? 's' : ''}</span>
          )}
        </div>

        {loading ? (
          <div className="order-loading">
            <div className="order-loading-spinner" />
            <p>Loading orders…</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="order-empty">
            <div className="order-empty-icon">📋</div>
            <p className="order-empty-title">No orders found</p>
            <p className="order-empty-text">Try adjusting your filters or date range.</p>
          </div>
        ) : (
          <>
            <div className="dashboard-table-wrap order-table-wrap">
              <table className="dashboard-table order-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th className="order-col-total">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={orderId(o)}>
                      <td><span className="order-id">#{orderId(o)}</span></td>
                      <td>{formatDate(o.orderDate ?? o.OrderDate)}</td>
                      <td className="order-email">{o.buyerEmail ?? o.BuyerEmail ?? '—'}</td>
                      <td>
                        <span className={`order-status-badge order-status-${(o.status ?? o.Status ?? '').toLowerCase()}`}>
                          {statusLabel(o.status ?? o.Status)}
                        </span>
                        {(o.status ?? o.Status) === 'PaymentFailed' && (o.paymentFailureReason ?? o.PaymentFailureReason) && (
                          <div className="order-list-failure-reason" title={o.paymentFailureReason ?? o.PaymentFailureReason}>
                            {String(o.paymentFailureReason ?? o.PaymentFailureReason).slice(0, 30)}
                            {(o.paymentFailureReason ?? o.PaymentFailureReason).length > 30 ? '…' : ''}
                          </div>
                        )}
                      </td>
                      <td>{o.itemCount ?? 0}</td>
                      <td className="order-col-total order-amount">${Number(o.total ?? o.Total ?? 0).toFixed(2)}</td>
                      <td className="dashboard-actions">
                        <Link to={`${ADMIN_DASHBOARD_PATH}/orders/${orderId(o)}`} className="order-view-btn">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalCount > pageSize && (
              <div className="order-pagination">
                <button type="button" className="order-pagination-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </button>
                <span className="order-pagination-info">
                  Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                </span>
                <button type="button" className="order-pagination-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
