import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import CouponMenu from './CouponMenu.jsx'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { count, setDrawerOpen } = useCart()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const name = user?.user_metadata?.nickname || user?.email

  useEffect(() => { setOpen(false) }, [pathname]) // 페이지를 옮기면 모바일 메뉴를 닫는다

  const openCart = () => {
    setOpen(false)
    if (user) setDrawerOpen(true)
    else navigate('/login', { state: { from: '/shop' } })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="nav">
      <Link to="/" className="logo">🍊 제주</Link>
      <div className="nav-mobile">
        <button className="navbtn" onClick={openCart} aria-label="장바구니">
          🛒{count > 0 && <span className="badge">{count}</span>}
        </button>
        <button className="burger" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="메뉴">
          {open ? '✕' : '☰'}
        </button>
      </div>
      <nav className={open ? 'open' : ''}>
        <NavLink to="/">홈</NavLink>
        <NavLink to="/gallery">갤러리</NavLink>
        <NavLink to="/map3d">3D 지도</NavLink>
        <NavLink to="/shop">특산품</NavLink>
        <CouponMenu />
        <button className="navbtn cart-d" onClick={openCart}>
          장바구니{count > 0 && <span className="badge">{count}</span>}
        </button>
        {user ? (
          <>
            <span className="who">{name}님</span>
            <button className="btn ghost" onClick={handleSignOut}>로그아웃</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn ghost">로그인</Link>
            <Link to="/signup" className="btn">회원가입</Link>
          </>
        )}
      </nav>
    </header>
  )
}
