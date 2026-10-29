import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { couponLabel } from './couponLabel.js'

// 상단 메뉴의 "쿠폰" 버튼 + 받을 수 있는 쿠폰 드롭다운
export default function CouponMenu() {
  const { user } = useAuth()
  const { myCoupons, claimCoupon } = useCart()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [coupons, setCoupons] = useState([])
  const [msg, setMsg] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!open || !supabase) return
    supabase.from('coupons').select('*').order('code').then(({ data, error }) => {
      if (!error) setCoupons(data)
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onClaim = async (c) => {
    if (!user) { setOpen(false); return navigate('/login', { state: { from: '/shop' } }) }
    setMsg(await claimCoupon(c))
  }

  return (
    <div className="menu" ref={ref}>
      <button className="navbtn" onClick={() => { setOpen((o) => !o); setMsg(null) }} aria-expanded={open}>
        🎟️ 쿠폰
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label="쿠폰 받기">
          <h3>쿠폰 받기</h3>
          {coupons.length === 0 && <p className="muted">받을 수 있는 쿠폰이 없습니다.</p>}
          {coupons.map((c) => {
            const owned = myCoupons.some((m) => m.code === c.code)
            return (
              <div className="coupon-card" key={c.code}>
                <div>
                  <strong>{couponLabel(c)}</strong>
                  <code>{c.code}</code>
                  <small>{c.description}</small>
                </div>
                <button className="btn" disabled={owned} onClick={() => onClaim(c)}>
                  {owned ? '받음 ✓' : '받기'}
                </button>
              </div>
            )
          })}
          {msg && <p className={msg.ok ? 'ok' : 'error'}>{msg.message}</p>}
          <p className="muted">받은 쿠폰은 장바구니의 쿠폰함에서 사용합니다.</p>
        </div>
      )}
    </div>
  )
}
