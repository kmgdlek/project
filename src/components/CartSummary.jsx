import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { couponLabel } from './couponLabel.js'

const won = (n) => n.toLocaleString('ko-KR') + '원'

// 쿠폰함 / 상품금액 / 할인(-20,000원 (50%)) / 결제 금액
export default function CartSummary() {
  const { items, coupon, selectCoupon, myCoupons, setDrawerOpen, subtotal, discount, discountPercent, total } = useCart()

  if (items.length === 0) return null

  return (
    <div className="summary">
      <div className="wallet">
        <div className="wallet-head">🎟️ 쿠폰함 <span>{myCoupons.length}</span></div>
        {myCoupons.length === 0 ? (
          <p className="muted">
            받은 쿠폰이 없습니다. <Link to="/shop" onClick={() => setDrawerOpen(false)}>특산품 페이지</Link>에서 쿠폰을 받아보세요.
          </p>
        ) : (
          <ul>
            {myCoupons.map((c) => (
              <li key={c.code}>
                <label className={coupon?.code === c.code ? 'on' : ''}>
                  <input
                    type="radio"
                    name="coupon"
                    checked={coupon?.code === c.code}
                    onChange={() => selectCoupon(c)}
                  />
                  <span className="cinfo"><strong>{c.code}</strong><small>{c.description}</small></span>
                  <span className="cval">{couponLabel(c)}</span>
                </label>
              </li>
            ))}
            {coupon && <li><button className="linkbtn" onClick={() => selectCoupon(null)}>쿠폰 사용 안 함</button></li>}
          </ul>
        )}
      </div>

      <div className="srow"><span>상품 금액</span><span>{won(subtotal)}</span></div>
      {discount > 0 && (
        <div className="srow disc"><span>할인</span><span>-{won(discount)} ({discountPercent}%)</span></div>
      )}
      <div className="srow final"><span>결제 금액</span><strong>{won(total)}</strong></div>
    </div>
  )
}
