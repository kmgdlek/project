import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function Navbar() {
  const { user, signOut } = useAuth()
  const { count, setDrawerOpen } = useCart()
  const navigate = useNavigate()
  const name = user?.user_metadata?.nickname || user?.email

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="nav">
      <Link to="/" className="logo">🍊 제주</Link>
      <nav>
        <NavLink to="/">홈</NavLink>
        <NavLink to="/gallery">갤러리</NavLink>
        <NavLink to="/shop">특산품</NavLink>
        <button
          className="navbtn"
          onClick={() => (user ? setDrawerOpen(true) : navigate('/login', { state: { from: '/shop' } }))}
        >
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
