import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { fetchOrderById, fetchStatusHistory } from '../lib/orders'

/**
 * Live tracking for a single order: the order row plus its status-change
 * history, both kept in sync via Supabase Realtime.
 *
 * @param {string} orderId order uuid
 * @returns {{ order: object|null, history: object[], loading: boolean, error: any, isLive: boolean, refetch: Function }}
 */
export function useOrderTracking(orderId) {
  const [order, setOrder] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isLive, setIsLive] = useState(false)

  const load = useCallback(async () => {
    if (!orderId) return
    setLoading(true)
    try {
      const [o, h] = await Promise.all([fetchOrderById(orderId), fetchStatusHistory(orderId)])
      setOrder(o)
      setHistory(h)
      setError(null)
    } catch (err) {
      console.error('Error loading order tracking:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!orderId) return

    const channel = supabase
      .channel(`order-tracking-${orderId}`)
      // The order row itself (status, totals, ...).
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setIsLive(true)
          setOrder((prev) => ({ ...prev, ...payload.new }))
        },
      )
      // New audit-trail entries as the status changes.
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'order_status_history', filter: `order_id=eq.${orderId}` },
        (payload) => {
          setIsLive(true)
          setHistory((prev) =>
            prev.some((h) => h.id === payload.new.id) ? prev : [...prev, payload.new],
          )
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsLive(true)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId])

  return { order, history, loading, error, isLive, refetch: load }
}
