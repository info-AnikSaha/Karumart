import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Radio, MapPin, CreditCard, User, Package } from 'lucide-react'
import { useOrderTracking } from '../hooks/useOrderTracking'
import { updateOrderStatus, allowedNext, getStatus, ORDER_STATUSES } from '../lib/orders'
import OrderStatusBadge from '../components/OrderStatusBadge'
import OrderStatusStepper from '../components/OrderStatusStepper'
import OrderStatusTimeline from '../components/OrderStatusTimeline'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { order, history, loading, isLive } = useOrderTracking(id)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')

  const handleChange = async (next) => {
    if (!order) return
    setSaving(true)
    try {
      await updateOrderStatus(order.id, next, null, note || null)
      setNote('')
      // Realtime pushes the update; no manual refetch needed.
    } catch (err) {
      console.error(err)
      alert('Failed to update status. See console.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-dark-400">Loading order...</div>
  }

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-dark-500">Order not found.</p>
        <button onClick={() => navigate('/orders')} className="text-primary-600 font-medium">
          ← Back to orders
        </button>
      </div>
    )
  }

  const nextOptions = allowedNext(order.status)
  const items = Array.isArray(order.items) ? order.items : []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/orders')}
            className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-dark-900">{order.order_number}</h2>
            <p className="text-dark-500">
              Placed {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLive && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
              <Radio className="w-4 h-4 animate-pulse" /> Live
            </span>
          )}
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* Progress stepper */}
      <div className="card p-6">
        <OrderStatusStepper status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details + items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer / shipping / payment */}
          <div className="card p-6 grid sm:grid-cols-3 gap-6">
            <InfoBlock icon={User} title="Customer">
              <p className="font-medium text-dark-900">{order.customer_name || '—'}</p>
              <p className="text-sm text-dark-500">{order.customer_email}</p>
              <p className="text-sm text-dark-500">{order.customer_phone}</p>
            </InfoBlock>
            <InfoBlock icon={MapPin} title="Ship to">
              <p className="text-sm text-dark-700">{order.shipping_address || '—'}</p>
            </InfoBlock>
            <InfoBlock icon={CreditCard} title="Payment">
              <p className="text-sm text-dark-700 capitalize">{order.payment_method || '—'}</p>
              <p className="text-sm text-dark-500 capitalize">{order.payment_status}</p>
            </InfoBlock>
          </div>

          {/* Items */}
          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 p-4 border-b border-dark-100">
              <Package className="w-5 h-5 text-dark-400" />
              <h3 className="font-semibold text-dark-900">Items</h3>
            </div>
            <table className="w-full">
              <tbody>
                {items.map((it, i) => (
                  <tr key={i} className="border-b border-dark-50 last:border-0">
                    <td className="py-3 px-6 text-sm text-dark-800">{it.name}</td>
                    <td className="py-3 px-6 text-sm text-dark-500 text-center">× {it.quantity}</td>
                    <td className="py-3 px-6 text-sm font-medium text-dark-900 text-right">
                      ৳{Number(it.price * it.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-6 space-y-2 bg-dark-50/40">
              <SummaryRow label="Subtotal" value={order.subtotal} />
              <SummaryRow label="Shipping" value={order.shipping_fee} />
              <div className="flex items-center justify-between pt-2 border-t border-dark-100">
                <span className="font-semibold text-dark-900">Total</span>
                <span className="font-bold text-lg text-gradient">৳{Number(order.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: status control + timeline */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-dark-900">Update Status</h3>
            {nextOptions.length === 0 ? (
              <p className="text-sm text-dark-500">This order is in a final state.</p>
            ) : (
              <>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note for this change..."
                  rows={2}
                  className="input resize-none"
                />
                <div className="flex flex-wrap gap-2">
                  {nextOptions.map((key) => {
                    const s = ORDER_STATUSES[key]
                    return (
                      <button
                        key={key}
                        disabled={saving}
                        onClick={() => handleChange(key)}
                        className="px-3 py-2 rounded-xl text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {getStatus(key).label}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="card p-6">
            <h3 className="font-semibold text-dark-900 mb-4">Tracking History</h3>
            <OrderStatusTimeline history={history} />
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-dark-400">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
      </div>
      {children}
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-dark-500">{label}</span>
      <span className="text-dark-800">৳{Number(value || 0).toLocaleString()}</span>
    </div>
  )
}
