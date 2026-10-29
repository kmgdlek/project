import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import ProductImage from './ProductImage.jsx'
import CartSummary from './CartSummary.jsx'

// 오른쪽에서 슬라이드로 열리는 장바구니 패널
export default function CartDrawer() {
  const { user } = useAuth()
  const { items, loading, error, drawerOpen, setDrawerOpen, setQuantity, removeItem, clearCart } = useCart()
  const navigate = useNavigate()
  const close = () => setDrawerOpen(false)

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen, setDrawerOpen])

  if (!user) return null

  return (
    <>
      <div className={`overlay ${drawerOpen ? 'open' : ''}`} onClick={close} />
      <aside className={`drawer ${drawerOpen ? 'open' : ''}`} aria-hidden={!drawerOpen} aria-label="장바구니">
        <div className="drawer-head">
          <h3>장바구니</h3>
          <div className="head-actions">
            {items.length > 0 && (
              <button className="linkbtn" onClick={() => window.confirm('장바구니를 모두 비울까요?') && clearCart()}>비우기</button>
            )}
            <button className="x" onClick={close} aria-label="닫기">✕</button>
          </div>
        </div>

        <div className="drawer-body">
          {error && <p className="error">{error}</p>}
          {loading && items.length === 0 && <p className="center">불러오는 중…</p>}
          {!loading && items.length === 0 && <p className="center">장바구니가 비어 있습니다.</p>}
          <ul className="dlist">
            {items.map((i) => (
              <li key={i.id}>
                <ProductImage product={i.product} />
                <div className="dinfo">
                  <strong>{i.product.name}</strong>
                  <span>{i.product.price.toLocaleString('ko-KR')}원</span>
                  <div className="qty">
                    <button onClick={() => setQuantity(i.id, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="수량 감소">−</button>
                    <span>{i.quantity}</span>
                    <button onClick={() => setQuantity(i.id, i.quantity + 1)} aria-label="수량 증가">+</button>
                    <button className="del" onClick={() => removeItem(i.id)}>삭제</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="drawer-foot">
          <CartSummary />
          <button className="btn big" onClick={() => { close(); navigate('/cart') }} disabled={items.length === 0}>
            결제하기
          </button>
        </div>
      </aside>
    </>
  )
}
