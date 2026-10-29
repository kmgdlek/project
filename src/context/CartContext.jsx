import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const addItem = async (productId) => {
    const existing = items.find((i) => i.product.id === productId)
    const { error } = existing
      ? await supabase.from('cart_items')
          .update({ quantity: existing.quantity + 1, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
      : await supabase.from('cart_items').insert({ product_id: productId, quantity: 1 })
    if (error) { setError(error.message); return false }
    await load()
    return true
  }

  const setQuantity = async (id, quantity) => {
    if (quantity < 1) return
    const { error } = await supabase.from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return setError(error.message)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
  }

  const removeItem = async (id) => {
    const { error } = await supabase.from('cart_items').delete().eq('id', id)
    if (error) return setError(error.message)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const value = useMemo(() => ({
    items, loading, error, addItem, setQuantity, removeItem,
    count: items.reduce((n, i) => n + i.quantity, 0),
    total: items.reduce((s, i) => s + i.quantity * i.product.price, 0),
  }), [items, loading, error]) // eslint-disable-line react-hooks/exhaustive-deps

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => useContext(CartContext)
