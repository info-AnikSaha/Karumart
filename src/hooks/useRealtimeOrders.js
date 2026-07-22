import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { fetchOrders, updateOrderStatus as apiUpdateStatus } from '../lib/orders'

// Fallback data so the UI stays functional when Supabase is unreachable /
// unconfigured (mirrors the graceful-degradation pattern in Users.jsx).
const MOCK_ORDERS = [
  { id: 'm1', order_number: 'KM-260722-0001', customer_name: 'Rahim Ahmed',     customer_email: 'rahim@example.com',    shipping_address: 'Dhaka, Bangladesh',      items: [{ name: 'Handloom Cotton Saree', quantity: 1, price: 2500 }], total_amount: 2500, status: 'delivered',        created_at: '2026-07-15T10:00:00Z' },
  { id: 'm2', order_number: 'KM-260722-0002', customer_name: 'Fatima Begum',    customer_email: 'fatima@example.com',   shipping_address: 'Chittagong, Bangladesh', items: [{ name: 'Organic Wild Honey', quantity: 2, price: 850 }],     total_amount: 1700, status: 'processing',       created_at: '2026-07-18T10:00:00Z' },
  { id: 'm3', order_number: 'KM-260722-0003', customer_name: 'Karim Miah',      customer_email: 'karim@example.com',    shipping_address: 'Sylhet, Bangladesh',     items: [{ name: 'Bamboo Craft Basket', quantity: 1, price: 1200 }],   total_amount: 1260, status: 'shipped',          created_at: '2026-07-19T10:00:00Z' },
  { id: 'm4', order_number: 'KM-260722-0004', customer_name: 'Nasrin Akter',    customer_email: 'nasrin@example.com',   shipping_address: 'Rajshahi, Bangladesh',   items: [{ name: 'Terracotta Water Pot', quantity: 3, price: 650 }],   total_amount: 1950, status: 'delivered',        created_at: '2026-07-20T10:00:00Z' },
  { id: 'm5', order_number: 'KM-260722-0005', customer_name: 'Jamal Uddin',     customer_email: 'jamal@example.com',    shipping_address: 'Khulna, Bangladesh',     items: [{ name: 'Jute Shopping Bag', quantity: 5, price: 450 }],      total_amount: 2250, status: 'cancelled',        created_at: '2026-07-20T10:00:00Z' },
  { id: 'm6', order_number: 'KM-260722-0006', customer_name: 'Sultana Parvin',  customer_email: 'sultana@example.com',  shipping_address: 'Comilla, Bangladesh',    items: [{ name: 'Handmade Soap Set', quantity: 2, price: 550 }],      total_amount: 1160, status: 'confirmed',        created_at: '2026-07-21T10:00:00Z' },
  { id: 'm7', order_number: 'KM-260722-0007', customer_name: 'Mostafiz Rahman', customer_email: 'mostafiz@example.com', shipping_address: 'Rangpur, Bangladesh',    items: [{ name: 'Pure Mustard Oil', quantity: 4, price: 280 }],       total_amount: 1120, status: 'out_for_delivery', created_at: '2026-07-21T10:00:00Z' },
  { id: 'm8', order_number: 'KM-260722-0008', customer_name: 'Rahima Khatun',   customer_email: 'rahima@example.com',   shipping_address: 'Dinajpur, Bangladesh',   items: [{ name: 'Clay Dinner Set', quantity: 1, price: 3200 }],       total_amount: 3200, status: 'pending',          created_at: '2026-07-22T10:00:00Z' },
]

/**
 * Live orders list. Loads once, then keeps state in sync via a Supabase
 * Realtime `postgres_changes` subscription on the orders table.
 *
 * @param {{ customerId?: string }} [options]
 * @returns {{ orders: object[], loading: boolean, error: any, isLive: boolean, updateStatus: Function, refetch: Function }}
 */
export function useRealtimeOrders(options = {}) {
  const { customerId } = options
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLive, setIsLive] = useState(false)
  // Keep customerId in a ref so the realtime handler filters without
  // re-subscribing on every render.
  const customerIdRef = useRef(customerId)
  customerIdRef.current = customerId

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchOrders({ customerId })
      setOrders(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching orders, using mock data:', err)
      setError(err)
      setOrders(customerId ? [] : MOCK_ORDERS)
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    load()
  }, [load])

  // Realtime subscription (independent of the initial load).
  useEffect(() => {
    const belongs = (row) => !customerIdRef.current || row?.customer_id === customerIdRef.current

    const channel = supabase
      .channel(`orders-changes${customerId ? `-${customerId}` : ''}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        setIsLive(true)
        setOrders((prev) => {
          if (payload.eventType === 'INSERT') {
            if (!belongs(payload.new) || prev.some((o) => o.id === payload.new.id)) return prev
            return [payload.new, ...prev]
          }
          if (payload.eventType === 'UPDATE') {
            if (!belongs(payload.new)) return prev
            return prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
          }
          if (payload.eventType === 'DELETE') {
            return prev.filter((o) => o.id !== payload.old.id)
          }
          return prev
        })
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsLive(true)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [customerId])

  const updateStatus = useCallback(async (id, next, note) => {
    // Optimistic update; realtime will reconcile with the authoritative row.
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: next } : o)))
    try {
      await apiUpdateStatus(id, next, null, note)
    } catch (err) {
      console.error('Failed to update status:', err)
      load() // rollback to server truth
      throw err
    }
  }, [load])

  return { orders, loading, error, isLive, updateStatus, refetch: load }
}
