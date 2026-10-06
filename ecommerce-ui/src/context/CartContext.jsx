import { createContext, useContext, useReducer, useEffect } from 'react'

const CartContext = createContext(null)

const CART_KEY = 'ecommerce_cart'

export function cartLineKey(id, size) {
  return size ? `${id}::${size}` : String(id)
}

function loadCart() {
  try {
    const s = localStorage.getItem(CART_KEY)
    const items = s ? JSON.parse(s) : []
    return Array.isArray(items)
      ? items.map((i) => ({ ...i, lineKey: i.lineKey || cartLineKey(i.id, i.size) }))
      : []
  } catch {
    return []
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const { id, name, price, image, quantity = 1, size = null } = action.payload
      const lineKey = cartLineKey(id, size)
      const existing = state.find((i) => i.lineKey === lineKey)
      let next
      if (existing) {
        next = state.map((i) => (i.lineKey === lineKey ? { ...i, quantity: i.quantity + quantity } : i))
      } else {
        next = [...state, { id, name, price, image, quantity, size, lineKey }]
      }
      saveCart(next)
      return next
    }
    case 'REMOVE': {
      const next = state.filter((i) => i.lineKey !== action.payload.lineKey)
      saveCart(next)
      return next
    }
    case 'UPDATE_QUANTITY': {
      const { lineKey, quantity } = action.payload
      if (quantity < 1) return cartReducer(state, { type: 'REMOVE', payload: { lineKey } })
      const next = state.map((i) => (i.lineKey === lineKey ? { ...i, quantity } : i))
      saveCart(next)
      return next
    }
    case 'CLEAR':
      saveCart([])
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [], () => loadCart())

  useEffect(() => {
    saveCart(items)
  }, [items])

  const addToCart = (product, quantity = 1, size = null) => {
    dispatch({
      type: 'ADD',
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        size,
      },
    })
  }

  const removeFromCart = (lineKey) => dispatch({ type: 'REMOVE', payload: { lineKey } })
  const updateQuantity = (lineKey, quantity) => dispatch({ type: 'UPDATE_QUANTITY', payload: { lineKey, quantity } })
  const clearCart = () => dispatch({ type: 'CLEAR' })

  const totalItems = items.reduce((n, i) => n + i.quantity, 0)
  const totalPrice = items.reduce((n, i) => n + i.price * i.quantity, 0)

  const value = {
    items,
    totalItems,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
