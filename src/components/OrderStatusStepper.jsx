import { ORDER_FLOW, getStatus } from '../lib/orders'
import { XCircle, RotateCcw } from 'lucide-react'

/**
 * Horizontal progress stepper for the order lifecycle
 * (pending → confirmed → processing → shipped → out_for_delivery → delivered).
 *
 * Cancelled / returned are terminal off-path states and render as a single
 * banner instead of the progress track. Shared by the admin OrderDetail page
 * and the (future) customer dashboard.
 */
export default function OrderStatusStepper({ status }) {
  // Off-path terminal states.
  if (status === 'cancelled' || status === 'returned') {
    const { label } = getStatus(status)
    const Icon = status === 'cancelled' ? XCircle : RotateCcw
    const tone = status === 'cancelled' ? 'text-red-600 bg-red-50' : 'text-rose-600 bg-rose-50'
    return (
      <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 ${tone}`}>
        <Icon className="w-6 h-6" />
        <div>
          <p className="font-semibold">Order {label}</p>
          <p className="text-sm opacity-80">This order is no longer in progress.</p>
        </div>
      </div>
    )
  }

  const currentIndex = ORDER_FLOW.indexOf(status)

  return (
    <div className="flex items-start">
      {ORDER_FLOW.map((key, i) => {
        const { label, icon: Icon, dot } = getStatus(key)
        const done = i < currentIndex
        const active = i === currentIndex
        const reached = done || active
        return (
          <div key={key} className="flex-1 flex flex-col items-center relative">
            {/* connector to the previous step */}
            {i > 0 && (
              <span
                className={`absolute top-5 right-1/2 w-full h-0.5 ${
                  i <= currentIndex ? dot : 'bg-dark-100'
                }`}
              />
            )}
            <div
              className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                reached ? `${dot} text-white` : 'bg-dark-100 text-dark-400'
              } ${active ? 'ring-4 ring-primary-100' : ''}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={`mt-2 text-xs font-medium text-center ${
                reached ? 'text-dark-900' : 'text-dark-400'
              }`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
