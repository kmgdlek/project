import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useCart } from '../context/CartContext.jsx'
import ProductImage from '../components/ProductImage.jsx'
import CartSummary from '../components/CartSummary.jsx'

const won = (n) => n.toLocaleString('ko-KR') + '원'

export default function Checkout() {
  const { items, coupon, afterOrder, subtotal, discount, total } = useCart()
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(null) // 주문 완료 스냅샷

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const snapshot = { items, subtotal, discount, total, coupon: coupon?.code ?? null, ...form }
    const { data, error } = await supabase.rpc('place_order', {
      p_name: form.name,
      p_phone: form.phone,
      p_address: form.address,
      p_coupon: coupon?.code ?? null,
    })
    setBusy(false)
    if (error) return setError(error.message)
    setDone({ ...snapshot, id: data })
    await afterOrder()
  }

  if (done) {
    return (
      <main className="section narrow">
        <div className="done">
          <div className="check">✓</div>
          <h2>주문이 완료되었습니다</h2>
          <p>주문번호 <strong>#{done.id}</strong></p>
        </div>
        <ul className="olist">
          {done.items.map((i) => (
            <li key={i.id}><span>{i.product.name} × {i.quantity}</span><span>{won(i.product.price * i.quantity)}</span></li>
          ))}
        </ul>
        <div className="summary">
          <div className="srow"><span>상품 금액</span><span>{won(done.subtotal)}</span></div>
          {done.discount > 0 && (
            <div className="srow disc"><span>할인 ({done.coupon})</span><span>-{won(done.discount)}</span></div>
          )}
          <div className="srow final"><span>결제 금액</span><strong>{won(done.total)}</strong></div>
        </div>
        <p className="muted">받는 분 {done.name} · {done.phone}<br />{done.address}</p>
        <Link className="btn big" to="/shop">쇼핑 계속하기</Link>
      </main>
    )
  }

  if (items.length === 0) {
    return (
      <main className="section narrow">
        <h2>주문하기</h2>
        <p className="center">장바구니가 비어 있습니다. <Link to="/shop">상품 보러 가기</Link></p>
      </main>
    )
  }

  return (
    <main className="section narrow">
      <h2>주문하기</h2>
      <div className="checkout">
        <form onSubmit={onSubmit} className="co-form">
          <h3>배송 정보</h3>
          <label>받는 분
            <input value={form.name} onChange={set('name')} required maxLength={30} autoComplete="name" />
          </label>
          <label>연락처
            <input value={form.phone} onChange={set('phone')} required inputMode="tel" placeholder="010-0000-0000" autoComplete="tel" />
          </label>
          <label>배송지
            <textarea value={form.address} onChange={set('address')} required rows={3} autoComplete="street-address" />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn big" disabled={busy}>{busy ? '주문 처리 중…' : `${won(total)} 주문하기`}</button>
          <p className="muted">실제 결제는 이루어지지 않으며, 주문 내용만 저장됩니다. 사용한 쿠폰은 쿠폰함에서 소진됩니다.</p>
        </form>

        <div className="co-side">
          <h3>주문 상품</h3>
          <ul className="olist">
            {items.map((i) => (
              <li key={i.id}>
                <ProductImage product={i.product} />
                <span>{i.product.name} × {i.quantity}</span>
                <span>{won(i.product.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <CartSummary />
        </div>
      </div>
    </main>
  )
}
