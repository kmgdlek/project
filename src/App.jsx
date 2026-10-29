import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import { isSupabaseConfigured } from './lib/supabase.js'
import Navbar from './components/Navbar.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Gallery from './pages/Gallery.jsx'
import Shop from './pages/Shop.jsx'
import Cart from './pages/Cart.jsx'
import CartDrawer from './components/CartDrawer.jsx'

function Protected({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <p className="center">불러오는 중…</p>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export default function App() {
  return (
    <>
      <Navbar />
      <CartDrawer />
      {!isSupabaseConfigured && (
        <div className="banner">
          Supabase 환경변수(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)가 설정되지 않았습니다. 로그인/회원가입이 동작하지 않습니다.
        </div>
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/gallery" element={<Protected><Gallery /></Protected>} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/cart" element={<Protected><Cart /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="footer">
        사진 출처: <a href="https://pixabay.com" target="_blank" rel="noreferrer">Pixabay</a>
      </footer>
    </>
  )
}
