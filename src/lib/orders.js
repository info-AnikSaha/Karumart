// Orders data-access layer + status configuration.
// Single source of truth for order status metadata (labels, colors, icons,
// allowed transitions) and all Supabase reads/writes for orders.

import {
  Clock, CheckCircle2, Package, Truck, MapPin, PackageCheck, XCircle, RotateCcw,
} from 'lucide-react'
import { supabase } from './supabase'

// ---------------------------------------------------------------------------
// Status configuration — must stay in sync with the order_status enum in
// supabase/migrations/0001_orders_tracking.sql
// ---------------------------------------------------------------------------
export const ORDER_STATUSES = {
  pending:          { key: 'pending',          label: 'Pending',          icon: Clock,        badge: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500',   allowedNext: ['confirmed', 'cancelled'] },
  confirmed:        { key: 'confirmed',        label: 'Confirmed',        icon: CheckCircle2, badge: 'bg-sky-100 text-sky-700',       dot: 'bg-sky-500',     allowedNext: ['processing', 'cancelled'] },
  processing:       { key: 'processing',       label: 'Processing',       icon: Package,      badge: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500',    allowedNext: ['shipped', 'cancelled'] },
  shipped:          { key: 'shipped',          label: 'Shipped',          icon: Truck,        badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500',  allowedNext: ['out_for_delivery', 'cancelled'] },
  out_for_delivery: { key: 'out_for_delivery', label: 'Out for Delivery', icon: MapPin,       badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500',  allowedNext: ['delivered', 'returned'] },
  delivered:        { key: 'delivered',        label: 'Delivered',        icon: PackageCheck, badge: 'bg-green-100 text-green-700',    dot: 'bg-green-500',   allowedNext: ['returned'] },
  cancelled:        { key: 'cancelled',        label: 'Cancelled',        icon: XCircle,      badge: 'bg-red-100 text-red-700',       dot: 'bg-red-500',     allowedNext: [] },
  returned:         { key: 'returned',         label: 'Returned',         icon: RotateCcw,    badge: 'bg-rose-100 text-rose-700',     dot: 'bg-rose-500',    allowedNext: [] },
}

// The "happy path" progression rendered by the horizontal stepper.
export const ORDER_FLOW = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered']

export const ORDER_STATUS_LIST = Object.values(ORDER_STATUSES)

/** Metadata for a status key, with a safe fallback for unknown values. */
export function getStatus(key) {
  return ORDER_STATUSES[key] || {
    key, label: key || 'Unknown', icon: Package,
    badge: 'bg-dark-100 text-dark-700', dot: 'bg-dark-400', allowedNext: [],
  }
}

/** Allowed next statuses for a given current status. */
export function allowedNext(key) {
  return ORDER_STATUSES[key]?.allowedNext ?? []
}

/** Human summary of an order's line items, e.g. "Wild Honey (+2 more)". */
export function summarizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) return '—'
  const first = items[0]?.name ?? 'Item'
  return items.length > 1 ? `${first} (+${items.length - 1} more)` : first
}

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------

/**
 * Fetch orders, newest first.
 * @param {{ customerId?: string, status?: string }} [filters]
 */
export async function fetchOrders(filters = {}) {
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
  if (filters.customerId) query = query.eq('customer_id', filters.customerId)
  if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

/** Fetch a single order by uuid. */
export async function fetchOrderById(id) {
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

/** Fetch the status-change audit trail for an order, oldest first. */
export async function fetchStatusHistory(orderId) {
  const { data, error } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

/**
 * Create an order. `order_number` is assigned by the database trigger.
 * @param {object} payload
 */
export async function createOrder(payload) {
  const { data, error } = await supabase.from('orders').insert(payload).select().single()
  if (error) throw error
  return data
}

/**
 * Update an order's status. The database logs the change into
 * order_status_history automatically; `note` is stored on the order.
 * @param {string} id order uuid
 * @param {string} next new status
 * @param {string|null} [changedBy] unused server-side (auth.uid() is used) but
 *        accepted for call-site clarity
 * @param {string|null} [note]
 */
export async function updateOrderStatus(id, next, changedBy = null, note = null) {
  const patch = { status: next }
  if (note) patch.notes = note
  const { data, error } = await supabase.from('orders').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data
}
