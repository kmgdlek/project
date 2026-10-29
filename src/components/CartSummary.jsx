import { useState } from 'react'
import { useCart } from '../context/CartContext.jsx'

const won = (n) => n.toLocaleString('ko-KR') + '원'

// 상품금액 / 쿠폰 입력 / 할인(-20,000원 (50%)) / 결제 금액
export default function CartSummary() {
  const { items, coupon, applyCoupon, removeCoupon, subtotal, discount, discountPercent, total } = useCart()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null) // { ok, message }
  const [busy, setBusy] = useState(false)

  const onApply = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    const result = await applyCoupon(code)
    setBusy(false)
    setMsg(result)
    if (result.ok) setCode('')
  }

  if (items.length === 0) return null

  return (
    <div className="summary">
      {coupon ? (
        <div className="coupon applied">
          <span>🎟️ {coupon.code}</span>
          <button className="linkbtn" onClick={() => { removeCoupon(); setMsg(null) }}>삭제</button>
        </div>
      ) : (
        <form className="coupon" onSubmit={onApply}>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="쿠폰 코드" aria-label="쿠폰 코드" />
          <button className="btn ghost" disabled={busy || !code.trim()}>적용</button>
        </form>
      )}
      {msg && !coupon && <p className={msg.ok ? 'ok' : 'error'}>{msg.message}</p>}

      <div className="srow"><span>상품 금액</span><span>{won(subtotal)}</span></div>
      {discount > 0 && (
        <div className="srow disc"><span>할인</span><span>-{won(discount)} ({discountPercent}%)</span></div>
      )}
      <div className="srow final"><span>결제 금액</span><strong>{won(total)}</strong></div>
    </div>
  )
}
