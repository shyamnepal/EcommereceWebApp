import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ADMIN_DASHBOARD_PATH } from '../../config'
import './DashboardLayout.css'

const NAV = [
  { to: `${ADMIN_DASHBOARD_PATH}/products`, label: 'Shoes', hint: 'Catalog & stock', match: 'products', icon: 'shoe' },
  { to: `${ADMIN_DASHBOARD_PATH}/categories`, label: 'Categories', hint: 'Product groups', match: 'categories', icon: 'tag' },
  { to: `${ADMIN_DASHBOARD_PATH}/orders`, label: 'Orders', hint: 'Sales & shipping', match: 'orders', icon: 'box' },
  { to: `${ADMIN_DASHBOARD_PATH}/users`, label: 'Users', hint: 'Accounts & roles', match: 'users', icon: 'users' },
]

function NavIcon({ name }) {
  const props = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.9', className: 'dash-nav-icon', 'aria-hidden': true }
  if (name === 'shoe') {
    return (
      <svg {...props}>
        <path d="M4 15c2-1 4-2 7-2 2 0 3 .5 5 2h4v2H4v-2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 13V9c0-1.5 1-3 3-3" strokeLinecap="round" />
      </svg>
    )
  }
  if (name === 'tag') {
    return (
      <svg {...props}>
        <path d="M20 13l-7 7-9-9V4h7l9 9z" strokeLinejoin="round" />
        <circle cx="7.5" cy="7.5" r="1.2" />
      </svg>
    )
  }
  if (name === 'box') {
    return (
      <svg {...props}>
        <path d="M21 8l-9-4-9 4v8l9 4 9-4V8z" strokeLinejoin="round" />
        <path d="M3 8l9 4 9-4M12 12v8" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M21 20c0-2.2-1.5-3.8-3.8-4.3" strokeLinecap="round" />
    </svg>
  )
}

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const initial = String(user || 'A').trim().charAt(0).toUpperCase()

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <Link to={ADMIN_DASHBOARD_PATH} className="dashboard-brand">
          <span className="dashboard-brand-mark">S</span>
          <span className="dashboard-brand-text">
            <strong>SoleStore</strong>
            <em>Dashboard</em>
          </span>
        </Link>

        <p className="dashboard-nav-label">Manage</p>
        <nav className="dashboard-nav">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(`${ADMIN_DASHBOARD_PATH}/${item.match}`)
            return (
              <Link key={item.to} to={item.to} className={active ? 'active' : ''}>
                <span className="dash-nav-icon-wrap">
                  <NavIcon name={item.icon} />
                </span>
                <span className="dash-nav-copy">
                  <span className="dash-nav-title">{item.label}</span>
                  <span className="dash-nav-hint">{item.hint}</span>
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="dashboard-sidebar-foot">
          {user && (
            <div className="dashboard-user-chip">
              <span className="dashboard-user-avatar" aria-hidden="true">{initial}</span>
              <span className="dashboard-user-meta">
                <span className="dashboard-user-name">{user}</span>
                <span className="dashboard-user-role">Administrator</span>
              </span>
            </div>
          )}
          <Link to="/" className="dashboard-back">← Back to store</Link>
          <button type="button" className="dashboard-logout" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  )
}
