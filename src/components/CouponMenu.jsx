import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { couponLabel } from './couponLabel.js'

// 상단 메뉴의 "코드 입력" 버튼 + 아래로 내려오는 쿠폰 코드 입력 패널
export default function CouponMenu() {
  const { user } = useAuth()
  const { claimCoupon } = useCart()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onSubmit = async (e) => {
    e.preventDefault()
    const value = code.trim().toUpperCase()
    if (!value) return
    if (!user) { setOpen(false); return navigate('/login', { state: { from: '/shop' } }) }
    setBusy(true)
    const { data, error } = await supabase.from('coupons').select('*').eq('code', value).maybeSingle()
    if (error) setMsg({ ok: false, message: error.message })
    else if (!data) setMsg({ ok: false, message: '유효하지 않은 쿠폰 코드입니다.' })
    else {
      const result = await claimCoupon(data)
      setMsg(result.ok ? { ok: true, message: `${data.code} (${couponLabel(data)}) 쿠폰이 쿠폰함에 담겼습니다.` } : result)
      if (result.ok) setCode('')
    }
    setBusy(false)
  }

  return (
    <div className="menu" ref={ref}>
      <button className="navbtn" onClick={() => { setOpen((o) => !o); setMsg(null) }} aria-expanded={open}>
        🎟️ 코드 입력
      </button>
      <div className={`popover ${open ? 'open' : ''}`} role="dialog" aria-label="쿠폰 코드 입력" aria-hidden={!open}>
        <form onSubmit={onSubmit}>
          <label htmlFor="coupon-code">쿠폰 코드</label>
          <div className="coupon">
            <input
              id="coupon-code"
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="예: JEJU50"
              autoComplete="off"
              tabIndex={open ? 0 : -1}
            />
            <button className="btn" disabled={busy || !code.trim()} tabIndex={open ? 0 : -1}>
              {busy ? '확인 중…' : '등록'}
            </button>
          </div>
        </form>
        {msg && <p className={msg.ok ? 'ok' : 'error'}>{msg.message}</p>}
        <p className="muted">등록한 쿠폰은 장바구니의 쿠폰함에서 사용합니다.</p>
      </div>
    </div>
  )
}
