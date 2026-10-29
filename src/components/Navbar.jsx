import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, signOut } = useAuth()
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
