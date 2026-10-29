import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import ProductImage from '../components/ProductImage.jsx'

export default function Shop() {
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!supabase) return setLoading(false)
    supabase.from('products').select('*').order('id').then(({ data, error }) => {
      if (error) setError(error.message)
      else setProducts(data)
      setLoading(false)
    })
  }, [])

  const onAdd = async (p) => {
    if (!user) return navigate('/login', { state: { from: '/shop' } })
    const ok = await addItem(p.id)
    if (ok) {
      setToast(`${p.name}을(를) 장바구니에 담았습니다.`)
      setTimeout(() => setToast(''), 2000)
    }
  }

  return (
    <main className="section">
      <h2>제주 특산품</h2>
      {loading && <p className="center">불러오는 중…</p>}
      {error && <p className="error">{error}</p>}
      <div className="grid3">
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
      {toast && <div className="toast">{toast}</div>}
    </main>
  )
}
