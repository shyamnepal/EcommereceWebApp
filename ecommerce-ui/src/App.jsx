import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ADMIN_DASHBOARD_PATH } from './config'
import { CartProvider } from './context/CartContext'
import { AuthProvider } from './context/AuthContext'
import { AUTH_SESSION_EXPIRED_EVENT } from './services/api'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Verify from './pages/Verify'
import About from './pages/About'
import Contact from './pages/Contact'
import Shipping from './pages/Shipping'
import Returns from './pages/Returns'
import SizeGuide from './pages/SizeGuide'
import Faq from './pages/Faq'
import AdminGuard from './components/AdminGuard'
import ChatWidget from './components/ChatWidget'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import ProductList from './pages/dashboard/ProductList'
import ProductForm from './pages/dashboard/ProductForm'
import CategoryList from './pages/dashboard/CategoryList'
import CategoryForm from './pages/dashboard/CategoryForm'
import OrderList from './pages/dashboard/OrderList'
import OrderDetail from './pages/dashboard/OrderDetail'
import UserList from './pages/dashboard/UserList'
import './App.css'

function LegacyDashboardRedirect() {
  const location = useLocation()
  const rest = location.pathname.replace(/^\/dashboard/, '') || ''
  return <Navigate to={`${ADMIN_DASHBOARD_PATH}${rest}${location.search}${location.hash}`} replace />
}

function SessionExpiryRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    const handler = () => navigate('/login', { replace: true })
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handler)
  }, [navigate])
  return null
}

function dashboardChildRoutes() {
  return (
    <>
      <Route index element={<DashboardHome />} />
      <Route path="products" element={<ProductList />} />
      <Route path="products/new" element={<ProductForm />} />
      <Route path="products/:id/edit" element={<ProductForm />} />
      <Route path="categories" element={<CategoryList />} />
      <Route path="categories/new" element={<CategoryForm />} />
      <Route path="categories/:id/edit" element={<CategoryForm />} />
      <Route path="orders" element={<OrderList />} />
      <Route path="orders/:id" element={<OrderDetail />} />
      <Route path="users" element={<UserList />} />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <SessionExpiryRedirect />
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/size-guide" element={<SizeGuide />} />
            <Route path="/faq" element={<Faq />} />
            <Route element={<AdminGuard />}>
              <Route path={ADMIN_DASHBOARD_PATH} element={<DashboardLayout />}>
                {dashboardChildRoutes()}
              </Route>
            </Route>
            <Route path="/dashboard/*" element={<LegacyDashboardRedirect />} />
          </Routes>
          <Footer />
          <ChatWidget />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
