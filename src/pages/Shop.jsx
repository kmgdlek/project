import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { couponLabel } from '../components/couponLabel.js'

export default function Shop() {
  const { user } = useAuth()
  const { addItem, setDrawerOpen, myCoupons, claimCoupon } = useCart()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [coupons, setCoupons] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [couponMsg, setCouponMsg] = useState(null)

  useEffect(() => {
    if (!supabase) return setLoading(false)
    Promise.all([
      supabase.from('products').select('*').order('id'),
      supabase.from('coupons').select('*').order('code'),
    ]).then(([p, c]) => {
      if (p.error) setError(p.error.message)
      else setProducts(p.data)
      if (!c.error) setCoupons(c.data)
      setLoading(false)
    })
  }, [])

  const requireLogin = () => navigate('/login', { state: { from: '/shop' } })

  const onAdd = (p) => {
    if (!user) return requireLogin()
    setDrawerOpen(true) // 서버 응답을 기다리지 않고 즉시 패널을 열고 화면에 반영
    addItem(p)
  }

  const onClaim = async (c) => {
    if (!user) return requireLogin()
    setCouponMsg(await claimCoupon(c))
  }

  return (
    <main className="section">
      <h2>제주 특산품</h2>
      {loading && <p className="center">불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      <div className="shop-layout">
        <div className="grid2">
          {products.map((p) => (
            <div className="product" key={p.id}>
              <ProductImage product={p} />
              <h3>{p.name}</h3>
              <p className="desc">{p.description}</p>
              <div className="row">
                <strong>{p.price.toLocaleString('ko-KR')}원</strong>
                <button className="btn" onClick={() => onAdd(p)}>담기</button>
              </div>
            </div>
          ))}
        </div>

        <aside className="coupon-panel">
          <h3>🎟️ 쿠폰 받기</h3>
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
          {couponMsg && <p className={couponMsg.ok ? 'ok' : 'error'}>{couponMsg.message}</p>}
          <p className="muted">받은 쿠폰은 장바구니의 쿠폰함에서 선택해 사용합니다.</p>
        </aside>
      </div>
    </main>
  )
}
