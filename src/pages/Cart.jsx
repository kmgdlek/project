import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import ProductImage from '../components/ProductImage.jsx'

export default function Cart() {
  const { items, loading, error, setQuantity, removeItem, total } = useCart()

  return (
    <main className="section">
      <h2>장바구니</h2>
      {error && <p className="error">{error}</p>}
      {loading && <p className="center">불러오는 중…</p>}
      {!loading && items.length === 0 && (
        <p className="center">장바구니가 비어 있습니다. <Link to="/shop">상품 보러 가기</Link></p>
      )}
      <ul className="cart">
        {items.map((i) => (
          <li key={i.id}>
            <ProductImage product={i.product} />
            <div className="info">
              <strong>{i.product.name}</strong>
              <span>{i.product.price.toLocaleString('ko-KR')}원</span>
            </div>
            <div className="qty">
              <button onClick={() => setQuantity(i.id, i.quantity - 1)} disabled={i.quantity <= 1} aria-label="수량 감소">−</button>
              <span>{i.quantity}</span>
              <button onClick={() => setQuantity(i.id, i.quantity + 1)} aria-label="수량 증가">+</button>
            </div>
            <strong className="line">{(i.product.price * i.quantity).toLocaleString('ko-KR')}원</strong>
            <button className="btn ghost" onClick={() => removeItem(i.id)}>삭제</button>
          </li>
        ))}
      </ul>
      {items.length > 0 && (
        <div className="total">
          합계 <strong>{total.toLocaleString('ko-KR')}원</strong>
        </div>
      )}
    </main>
  )
}
