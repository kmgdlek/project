import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { isSupabaseConfigured } from '../lib/supabase.js'

export default function Login() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={location.state?.from || '/gallery'} replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!isSupabaseConfigured) return setError('Supabase 설정이 필요합니다.')
    setBusy(true)
    setError('')
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? '이메일 또는 비밀번호가 올바르지 않습니다.'
        : error.message === 'Email not confirmed'
          ? '이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.'
          : error.message)
      return
    }
    navigate(location.state?.from || '/gallery', { replace: true })
  }

  return (
    <main className="auth">
      <form onSubmit={onSubmit}>
        <h2>로그인</h2>
        <label>이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>비밀번호
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn big" disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button>
        <p className="sub">계정이 없으신가요? <Link to="/signup">회원가입</Link></p>
      </form>
    </main>
  )
}
