import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { isSupabaseConfigured } from '../lib/supabase.js'

export default function Signup() {
  const { user, signUp } = useAuth()
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/gallery" replace />

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!isSupabaseConfigured) return setError('Supabase 설정이 필요합니다.')
    if (password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.')
    if (password !== confirm) return setError('비밀번호가 일치하지 않습니다.')
    setBusy(true)
    const { data, error } = await signUp(email, password, nickname)
    setBusy(false)
    if (error) return setError(error.message)
    // 이메일 인증을 켜두면 session이 null → 메일 확인 안내
    if (!data.session) setNotice('가입 확인 메일을 보냈습니다. 메일의 링크를 눌러 인증을 완료한 뒤 로그인해 주세요.')
  }

  if (notice) {
    return (
      <main className="auth">
        <div className="form">
          <h2>메일을 확인해 주세요 ✉️</h2>
          <p>{notice}</p>
          <Link className="btn big" to="/login">로그인으로 이동</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="auth">
      <form onSubmit={onSubmit}>
        <h2>회원가입</h2>
        <label>닉네임
          <input value={nickname} onChange={(e) => setNickname(e.target.value)} required maxLength={20} />
        </label>
        <label>이메일
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>비밀번호 (6자 이상)
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        </label>
        <label>비밀번호 확인
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn big" disabled={busy}>{busy ? '가입 중…' : '가입하기'}</button>
        <p className="sub">이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
      </form>
    </main>
  )
}
