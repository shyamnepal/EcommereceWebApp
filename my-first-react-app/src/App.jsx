import './App.css'
import Home from './pages/home'
import Login from './pages/login'
import Signup from './pages/signup'
import OTP from './pages/otp'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/otp" element={<OTP />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
