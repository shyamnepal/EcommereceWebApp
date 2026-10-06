import { API_BASE_URL, API_KEY_ADMIN, API_KEY_USER } from '../config'

// Must match AuthContext TOKEN_KEY so the JWT from login is sent with requests
const TOKEN_KEY = 'ecommerce_token'
const USER_KEY = 'ecommerce_user'
export const AUTH_SESSION_EXPIRED_EVENT = 'auth:session-expired'

function clearAuthAndNotifyExpired() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('ecommerce_is_admin')
    window.dispatchEvent(new CustomEvent(AUTH_SESSION_EXPIRED_EVENT))
  } catch (_) {}
}

/**
 * Ecommerce_api – matches your .NET controllers and entities.
 * Sends JWT when user is logged in; X-API-KEY is optional fallback for server-to-server.
 * On 401 (expired/invalid token), clears auth and dispatches AUTH_SESSION_EXPIRED_EVENT so the app logs out and redirects.
 */
async function request(endpoint, options = {}) {
  const { useAdminKey, ...fetchOptions } = options
  const url = `${API_BASE_URL}${endpoint}`
  const headers = { 'Content-Type': 'application/json', ...fetchOptions.headers }
  const token = typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (useAdminKey === true) headers['X-API-KEY'] = API_KEY_ADMIN
  else if (useAdminKey === false) headers['X-API-KEY'] = API_KEY_USER
  const res = await fetch(url, { ...fetchOptions, headers })
  if (!res.ok) {
    if (res.status === 401 && token) clearAuthAndNotifyExpired()
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

/** Pick first defined from obj (supports both PascalCase and camelCase from .NET API) */
function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj[k] ?? obj[k.charAt(0).toUpperCase() + k.slice(1)]
    if (v !== undefined && v !== null) return v
  }
  return undefined
}

/**
 * Resolve image URL for display. Paths and R2 API URLs go through the API image proxy (that endpoint is not public).
 */
export function getImageUrl(storedUrl) {
  if (!storedUrl || typeof storedUrl !== 'string') return null
  if (storedUrl.includes('r2.cloudflarestorage.com')) {
    try {
      const path = new URL(storedUrl).pathname
      return `${API_BASE_URL}/api/Bucket/Image?path=${encodeURIComponent(path)}`
    } catch {
      return `${API_BASE_URL}/api/Bucket/Image?path=${encodeURIComponent(storedUrl)}`
    }
  }
  if (storedUrl.startsWith('http://') || storedUrl.startsWith('https://')) return storedUrl
  return `${API_BASE_URL}/api/Bucket/Image?path=${encodeURIComponent(storedUrl)}`
}

/** Map API Product to UI shape { id, name, price, category, image, description } */
function mapProduct(apiProduct) {
  if (!apiProduct) return null
  const category = apiProduct.category || apiProduct.Category
  const images = apiProduct.productImages || apiProduct.ProductImages || []
  const firstImage = images[0]
  const rawImage = firstImage?.imageUrl ?? firstImage?.ImageUrl ?? null
  return {
    id: pick(apiProduct, 'productId', 'ProductId'),
    name: pick(apiProduct, 'productName', 'ProductName') || '',
    price: Number(pick(apiProduct, 'price', 'Price') ?? 0),
    categoryId: pick(apiProduct, 'categoryId', 'CategoryId'),
    category: category?.categoryName ?? category?.CategoryName ?? null,
    image: getImageUrl(rawImage) ?? rawImage,
    description: pick(apiProduct, 'description', 'Description') ?? null,
    stockQuantity: pick(apiProduct, 'stockQuentity', 'StockQuentity'),
    productImages: images,
  }
}

/** Map API Category to UI shape { id, name } */
function mapCategory(apiCategory) {
  if (!apiCategory) return null
  return {
    id: pick(apiCategory, 'categoryId', 'CategoryId'),
    name: pick(apiCategory, 'categoryName', 'CategoryName') || '',
    description: pick(apiCategory, 'description', 'Description') ?? null,
  }
}

/**
 * GET api/Product/AllProduct
 * Returns array of products with Category and ProductImages (from your API).
 */
export async function getProducts(categoryFilter = '') {
  try {
    const data = await request('/api/Product/AllProduct')
    const list = Array.isArray(data) ? data : data.data || data.products || []
    const mapped = list.map(mapProduct).filter(Boolean)
    if (!categoryFilter) return mapped
    const slug = categoryFilter.toLowerCase()
    return mapped.filter(
      (p) =>
        (p.category || '').toLowerCase() === slug ||
        String(p.categoryId) === String(categoryFilter)
    )
  } catch {
    return getMockProducts(categoryFilter)
  }
}

/**
 * GET api/Product/Recommend?productId={id}&limit=4
 * Returns array of recommended products (same category, then others). Omit productId for general recommendations.
 */
export async function getRecommendations(productId = null, limit = 4) {
  const params = new URLSearchParams()
  if (productId != null) params.set('productId', String(productId))
  params.set('limit', String(Math.min(12, Math.max(1, limit))))
  const data = await request(`/api/Product/Recommend?${params}`)
  const list = Array.isArray(data) ? data : data.data || data.products || []
  return list.map(mapProduct).filter(Boolean)
}

/**
 * POST api/AI/Chat – send message to AI assistant, get reply.
 * Body: { message: string }
 */
export async function sendChatMessage(message) {
  const data = await request('/api/AI/Chat', {
    method: 'POST',
    body: JSON.stringify({ message: String(message).trim() }),
  })
  return data?.reply ?? data?.Reply ?? 'No response.'
}

/**
 * GET api/Product/GetProductById?id={id}
 * Returns ShoesResponse with Data = Product.
 */
export async function getProduct(id) {
  try {
    const data = await request(`/api/Product/GetProductById?id=${encodeURIComponent(id)}`)
    const product = data?.data ?? data
    return mapProduct(product) || getMockProduct(id)
  } catch {
    return getMockProduct(id)
  }
}

/**
 * GET api/Category/AllCategory (public; no auth required).
 */
export async function getCategories() {
  try {
    const data = await request('/api/Category/AllCategory')
    const list = Array.isArray(data) ? data : data.data || data.categories || []
    return list.map(mapCategory).filter(Boolean)
  } catch {
    try {
      const products = await getProducts('')
      const byName = new Map()
      products.forEach((p) => {
        if (p.category && !byName.has(p.category)) {
          byName.set(p.category, { id: p.categoryId || p.category, name: p.category })
        }
      })
      return Array.from(byName.values())
    } catch {
      return getMockCategories()
    }
  }
}

/**
 * GET api/Basket?id={basketId}
 */
export async function getBasket(basketId) {
  if (!basketId) return null
  try {
    return await request(`/api/Basket?id=${encodeURIComponent(basketId)}`)
  } catch {
    return null
  }
}

/**
 * POST api/Basket – body: CustomerBasket { customerBasketId, items: BasketItem[] }
 * BasketItem: basketItemId (product id), productName, price, quantity, pictureUrl, brand, type
 */
export async function updateBasket(basket) {
  try {
    return await request('/api/Basket', {
      method: 'POST',
      body: JSON.stringify(basket),
    })
  } catch (e) {
    throw e
  }
}

/**
 * GET api/Order/DeliveryMethods
 */
export async function getDeliveryMethods() {
  const data = await request('/api/Order/DeliveryMethods')
  return Array.isArray(data) ? data : []
}

/**
 * GET api/Order/LastShippingAddress – returns the current user's last shipping address from their most recent order.
 * Requires auth. Returns null if user has no orders or 204 No Content.
 */
export async function getLastShippingAddress() {
  const url = `${API_BASE_URL}/api/Order/LastShippingAddress`
  const token = typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(url, { method: 'GET', headers })
  if (res.status === 204 || res.status === 401) return null
  if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`)
  const data = await res.json()
  return data
}

/**
 * POST api/Order/CreateOrder – body: OrderDto { basketId, deliverMethodId, shipToAddress, buyerEmail? }
 * Returns { orderId, clientSecret, paymentIntentId } for Stripe confirmCardPayment.
 */
export async function createOrder(body) {
  return request('/api/Order/CreateOrder', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * GET api/Payments/PublishableKey – returns { publishableKey }
 */
export async function getStripePublishableKey() {
  const data = await request('/api/Payments/PublishableKey')
  return data?.publishableKey ?? data?.PublishableKey ?? ''
}

/**
 * POST api/Payments/ConfirmPayment – body: { paymentIntentId }.
 * Call after Stripe confirmCardPayment succeeds to set order status to PaymentReceived immediately.
 */
export async function confirmPayment(paymentIntentId) {
  return request('/api/Payments/ConfirmPayment', {
    method: 'POST',
    body: JSON.stringify({ paymentIntentId: paymentIntentId || '' }),
  })
}

// ——— Admin Orders & Dashboard ———

/**
 * GET api/AdminOrders?page=1&pageSize=10&dateFrom=&dateTo=&status=
 * Returns { items, totalCount, page, pageSize, totalPages }
 */
export async function getAdminOrders({ page = 1, pageSize = 10, dateFrom, dateTo, status } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)
  if (status) params.set('status', status)
  return request(`/api/AdminOrders?${params}`, { useAdminKey: true })
}

/**
 * GET api/AdminOrders/:id
 */
export async function getAdminOrderById(id) {
  return request(`/api/AdminOrders/${id}`, { useAdminKey: true })
}

/**
 * GET api/AdminOrders/Dashboard/Summary
 */
export async function getDashboardSummary() {
  return request('/api/AdminOrders/Dashboard/Summary', { useAdminKey: true })
}

/**
 * GET api/AdminOrders/Dashboard/RevenueByDate?dateFrom=&dateTo=
 */
export async function getRevenueByDate(dateFrom, dateTo) {
  const params = new URLSearchParams({ dateFrom, dateTo })
  return request(`/api/AdminOrders/Dashboard/RevenueByDate?${params}`, { useAdminKey: true })
}

/**
 * GET api/AdminOrders/Dashboard/TopProducts?limit=10&dateFrom=&dateTo=
 */
export async function getTopProducts(limit = 10, dateFrom, dateTo) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (dateFrom) params.set('dateFrom', dateFrom)
  if (dateTo) params.set('dateTo', dateTo)
  return request(`/api/AdminOrders/Dashboard/TopProducts?${params}`, { useAdminKey: true })
}

/**
 * PATCH api/AdminOrders/:id/Status – body: { status: "Shipped" }
 */
export async function updateOrderStatus(id, status) {
  return request(`/api/AdminOrders/${id}/Status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: String(status) }),
    useAdminKey: true,
  })
}

// ——— Admin Users ———

/**
 * GET api/AdminUsers?page=1&pageSize=20&q=
 * Returns { items, totalCount, page, pageSize, totalPages }
 */
export async function getAdminUsers({ page = 1, pageSize = 20, q } = {}) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  if (q) params.set('q', String(q))
  return request(`/api/AdminUsers?${params}`, { useAdminKey: true })
}

/**
 * GET api/AdminUsers/:id
 */
export async function getAdminUserById(id) {
  return request(`/api/AdminUsers/${encodeURIComponent(id)}`, { useAdminKey: true })
}

/**
 * PATCH api/AdminUsers/:id/Lock – body: { locked: true }
 */
export async function setUserLock(id, locked) {
  return request(`/api/AdminUsers/${encodeURIComponent(id)}/Lock`, {
    method: 'PATCH',
    body: JSON.stringify({ locked: !!locked }),
    useAdminKey: true,
  })
}

/**
 * PUT api/AdminUsers/:id/Roles – body: { roles: ["Admin","User"] }
 */
export async function setUserRoles(id, roles) {
  return request(`/api/AdminUsers/${encodeURIComponent(id)}/Roles`, {
    method: 'PUT',
    body: JSON.stringify({ roles: Array.isArray(roles) ? roles : [] }),
    useAdminKey: true,
  })
}

/**
 * DELETE api/AdminUsers/:id
 */
export async function deleteUser(id) {
  return request(`/api/AdminUsers/${encodeURIComponent(id)}`, { method: 'DELETE', useAdminKey: true })
}

/**
 * POST api/AdminUsers/Create – admin creates a new user.
 * Body: { userName, email, password, address?, roles? }
 */
export async function createAdminUser(body) {
  return request('/api/AdminUsers/Create', {
    method: 'POST',
    body: JSON.stringify({
      userName: body.userName ?? '',
      email: body.email ?? '',
      password: body.password ?? '',
      address: body.address ?? null,
      roles: body.roles ?? ['User'],
    }),
    useAdminKey: true,
  })
}

/**
 * PATCH api/AdminUsers/:id/Password – admin sets new password for any user.
 * Body: { newPassword }
 */
export async function setUserPassword(id, newPassword) {
  return request(`/api/AdminUsers/${encodeURIComponent(id)}/Password`, {
    method: 'PATCH',
    body: JSON.stringify({ newPassword: String(newPassword || '') }),
    useAdminKey: true,
  })
}

// ——— Dashboard (ProductViewModel / CategoryViewModel) ———

/**
 * POST api/Product/AddProduct
 * Body: ProductViewModel { categoryId, productName, description, price, stockQuentity }
 */
export async function addProduct(body) {
  const payload = {
    categoryId: body.categoryId ?? null,
    productName: body.productName ?? '',
    description: body.description ?? '',
    price: body.price ?? 0,
    stockQuentity: body.stockQuentity ?? 0,
  }
  return request('/api/Product/AddProduct', { method: 'POST', body: JSON.stringify(payload), useAdminKey: true })
}

/**
 * PUT api/Product/UpdateProduct
 * Body: ProductViewModel { productId, categoryId, productName, description, price, stockQuentity }
 */
export async function updateProduct(body) {
  const payload = {
    productId: body.productId,
    categoryId: body.categoryId ?? null,
    productName: body.productName ?? '',
    description: body.description ?? '',
    price: body.price ?? 0,
    stockQuentity: body.stockQuentity ?? 0,
  }
  return request('/api/Product/UpdateProduct', { method: 'PUT', body: JSON.stringify(payload), useAdminKey: true })
}

/**
 * DELETE api/Product/DeleteProduct?id={id}
 */
export async function deleteProduct(id) {
  return request(`/api/Product/DeleteProduct?id=${encodeURIComponent(id)}`, { method: 'DELETE', useAdminKey: true })
}

/**
 * POST api/Category/AddCategory
 * Body: CategoryViewModel { categoryName, description }
 */
export async function addCategory(body) {
  const payload = { categoryName: body.categoryName ?? '', description: body.description ?? null }
  return request('/api/Category/AddCategory', { method: 'POST', body: JSON.stringify(payload), useAdminKey: true })
}

/**
 * PUT api/Category/EditCategory
 * Body: CategoryViewModel { categoryId, categoryName, description }
 */
export async function updateCategory(body) {
  const payload = {
    categoryId: body.categoryId,
    categoryName: body.categoryName ?? '',
    description: body.description ?? null,
  }
  return request('/api/Category/EditCategory', { method: 'PUT', body: JSON.stringify(payload), useAdminKey: true })
}

/**
 * DELETE api/Category/DeleteCategory?id={id}
 */
export async function deleteCategory(id) {
  return request(`/api/Category/DeleteCategory?id=${encodeURIComponent(id)}`, { method: 'DELETE', useAdminKey: true })
}

/**
 * Admin: upload product images (JWT required).
 * POST api/Bucket with multipart/form-data: productName, brand, productId, files[], imageAltText
 */
export async function uploadProductImages({ productId, productName, brand, files, imageAltText = '' }) {
  const formData = new FormData()
  formData.append('productName', productName)
  formData.append('brand', brand || productName)
  formData.append('productId', String(productId))
  formData.append('imageAltText', imageAltText)
  if (files && files.length) {
    for (const file of files) formData.append('files', file)
  }
  const token = typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)
  const headers = { 'X-API-KEY': API_KEY_ADMIN }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE_URL}/api/Bucket`, {
    method: 'POST',
    headers,
    body: formData,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 401 && token) clearAuthAndNotifyExpired()
    throw new Error(data?.message || data?.Message || `Upload failed: ${res.status}`)
  }
  return data
}

/**
 * Admin: soft-delete a product image (JWT required).
 * DELETE api/Bucket/DeleteImage/{imageId}
 */
export async function deleteProductImage(imageId) {
  return request(`/api/Bucket/DeleteImage/${encodeURIComponent(imageId)}`, { method: 'DELETE', useAdminKey: true })
}

// ——— Auth (api/Account) ———

/**
 * POST api/Account/Login
 * Body: { userName, password }
 * Returns: { status, message, token } on success.
 */
export async function login(credentials) {
  const res = await fetch(`${API_BASE_URL}/api/Account/Login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': API_KEY_USER },
    body: JSON.stringify({
      userName: credentials.userName,
      password: credentials.password,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.message || 'Login failed')
  return data
}

/**
 * POST api/Account/UserRegister
 * Body: { userName, password, email, address }
 * Backend returns 200 even on failure; check status and message.
 */
export async function register(userData) {
  const res = await fetch(`${API_BASE_URL}/api/Account/UserRegister`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': API_KEY_USER },
    body: JSON.stringify({
      userName: userData.userName,
      password: userData.password,
      email: userData.email,
      address: userData.address,
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message ?? data?.Message ?? 'Registration failed')
  }
  // Backend returns 200 with status "Failed" or message when registration fails
  const status = data?.Status ?? data?.status
  const message = data?.message ?? data?.Message
  const userId = data?.data ?? data?.Data
  if (status === 'Failed' || (userId == null && message)) {
    throw new Error(message || 'Registration failed. Check user details and try again.')
  }
  return data
}

/**
 * POST api/Account/VerifyAccount
 * Body matches VerificaitonViewModel: { UserId, verificationCode } (6-digit code)
 * Calls backend VerifyAccount action to verify the user.
 */
export async function verifyAccount(userId, verificationCode) {
  const code = String(verificationCode).trim()
  if (!userId || !code) {
    throw new Error('UserId and verification code are required')
  }
  const res = await fetch(`${API_BASE_URL}/api/Account/VerifyAccount`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-KEY': API_KEY_USER },
    body: JSON.stringify({
      UserId: userId,
      verificationCode: code,
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.message || data?.Message || 'Verification failed')
  }
  if (data?.Status === 'Failed' || data?.status === 'Failed') {
    throw new Error(data?.Message ?? data?.message ?? 'Verification failed')
  }
  return data
}

// ——— Mock data when API is not available ———
function getMockCategories() {
  return [
    { id: 1, name: 'Shoes' },
    { id: 2, name: 'Accessories' },
    { id: 3, name: 'Clothing' },
  ]
}

function getMockProducts(categoryFilter) {
  const all = [
    { id: 1, name: 'Classic Running Shoes', price: 89.99, categoryId: 1, category: 'Shoes', image: null, description: 'Comfortable everyday runners.' },
    { id: 2, name: 'Leather Sneakers', price: 129.99, categoryId: 1, category: 'Shoes', image: null, description: 'Premium leather casual sneakers.' },
    { id: 3, name: 'Trail Hiking Boots', price: 149.99, categoryId: 1, category: 'Shoes', image: null, description: 'Durable for outdoor trails.' },
    { id: 4, name: 'Minimalist Canvas', price: 49.99, categoryId: 1, category: 'Shoes', image: null, description: 'Lightweight canvas shoes.' },
    { id: 5, name: 'Sports Cap', price: 24.99, categoryId: 2, category: 'Accessories', image: null, description: 'Adjustable sports cap.' },
  ]
  if (!categoryFilter) return all
  const slug = String(categoryFilter).toLowerCase()
  return all.filter(
    (p) => (p.category || '').toLowerCase() === slug || String(p.categoryId) === String(categoryFilter)
  )
}

function getMockProduct(id) {
  const list = getMockProducts('')
  const found = list.find((p) => String(p.id) === String(id))
  return found || list[0]
}
