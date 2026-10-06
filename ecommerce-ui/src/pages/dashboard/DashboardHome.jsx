import { Navigate } from 'react-router-dom'
import { ADMIN_DASHBOARD_PATH } from '../../config'

export default function DashboardHome() {
  return <Navigate to={`${ADMIN_DASHBOARD_PATH}/products`} replace />
}
