import { getStatus } from '../lib/orders'

/**
 * Status pill for an order. Reads label/color/icon from ORDER_STATUSES with a
 * safe fallback for unknown status values.
 */
export default function OrderStatusBadge({ status, className = '' }) {
  const { label, icon: Icon, badge } = getStatus(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${badge} ${className}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </span>
  )
}
