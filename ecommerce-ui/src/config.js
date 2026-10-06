/**
 * Shoes Ecommerce API base URL (no trailing slash).
 * - API runs at http://localhost:5232 (or https://localhost:7247 for HTTPS).
 * - Set VITE_API_URL in .env to override (e.g. VITE_API_URL=https://localhost:7247).
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5232'

/**
 * API keys for role-based access (must match appsettings.json ApiClients).
 * - Admin key: dashboard (categories, product add/update/delete).
 * - User key: shop (products, basket, etc.).
 */
export const API_KEY_ADMIN = import.meta.env.VITE_API_KEY_ADMIN || 'admin-key-xyz'
export const API_KEY_USER = import.meta.env.VITE_API_KEY_USER || 'user-key-abc'

/** Admin dashboard (header Admin button, login, nested pages). */
export const ADMIN_DASHBOARD_PATH = '/admin/dashboard'
