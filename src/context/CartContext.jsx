import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)

// 화면은 즉시 갱신(낙관적 업데이트)하고 DB 반영은 뒤에서 처리한다. 실패하면 서버 상태로 되돌린다.
export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [coupon, setCoupon] = useState(null) // { code, discount_type, discount_value }
  const pendingInserts = useRef(new Map()) // 임시 id -> 진행 중인 insert Promise(실제 id)

  const load = useCallback(async () => {
    if (!supabase || !user) return setItems([])
    setLoading(true)
    const { data, error } = await supabase
      .from('cart_items')
      .select('id, quantity, product:products(id, name, price, image_url)')
      .order('created_at')
    setLoading(false)
    if (error) return setError(error.message)
    setError('')
    setItems(data.filter((i) => i.product))
  }, [user])

  useEffect(() => { load() }, [load])

  const fail = (message) => { setError(message); load() }

  // 임시 행이면 insert가 끝나 실제 id가 나올 때까지 기다린다
  const realId = async (id) => (pendingInserts.current.has(id) ? pendingInserts.current.get(id) : id)

  const addItem = async (product) => {
    const existing = items.find((i) => i.product.id === product.id)
    if (existing) {
      const quantity = existing.quantity + 1
      setItems((prev) => prev.map((i) => (i.id === existing.id ? { ...i, quantity } : i)))
      const id = await realId(existing.id)
      const { error } = await supabase.from('cart_items')
        .update({ quantity, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) fail(error.message)
      return !error
    }

    const tmpId = `tmp-${Date.now()}-${Math.random()}`
    setItems((prev) => [...prev, { id: tmpId, quantity: 1, product }])
    const insert = supabase.from('cart_items')
      .insert({ product_id: product.id, quantity: 1 }).select('id').single()
      .then(({ data, error }) => {
        if (error) throw error
        setItems((prev) => prev.map((i) => (i.id === tmpId ? { ...i, id: data.id } : i)))
        return data.id
      })
    pendingInserts.current.set(tmpId, insert)
    try {
      await insert
      return true
    } catch (e) {
      fail(e.message)
      return false
    } finally {
      pendingInserts.current.delete(tmpId)
    }
  }

  const setQuantity = async (id, quantity) => {
    if (quantity < 1) return
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
    const { error } = await supabase.from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() }).eq('id', await realId(id))
    if (error) fail(error.message)
  }

  const removeItem = async (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    const { error } = await supabase.from('cart_items').delete().eq('id', await realId(id))
    if (error) fail(error.message)
  }

  const clearCart = async () => {
    setItems([])
    setCoupon(null)
    const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id)
    if (error) fail(error.message)
  }

  const applyCoupon = async (code) => {
    const { data, error } = await supabase.rpc('get_coupon', { p_code: code })
    if (error) return { ok: false, message: error.message }
    if (!data?.length) return { ok: false, message: '유효하지 않은 쿠폰입니다.' }
    setCoupon(data[0])
    return { ok: true, message: `쿠폰 ${data[0].code}이(가) 적용되었습니다.` }
  }

  const removeCoupon = () => setCoupon(null)

  const subtotal = items.reduce((s, i) => s + i.quantity * i.product.price, 0)
  const rawDiscount = !coupon ? 0
    : coupon.discount_type === 'percent'
      ? Math.floor((subtotal * coupon.discount_value) / 100)
      : coupon.discount_value
  const discount = Math.min(rawDiscount, subtotal)
  const discountPercent = subtotal ? Math.round((discount / subtotal) * 100) : 0

  const value = useMemo(() => ({
    items, loading, error, drawerOpen, setDrawerOpen, addItem, setQuantity, removeItem,
    clearCart, coupon, applyCoupon, removeCoupon,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal, discount, discountPercent, total: subtotal - discount,
  }), [items, loading, error, drawerOpen, coupon]) // eslint-disable-line react-hooks/exhaustive-deps

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
