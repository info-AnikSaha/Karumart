import { getStatus } from '../lib/orders'

function formatWhen(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Vertical audit trail of status changes from order_status_history.
 * Newest entry is highlighted at the top. Shared by admin + customer views.
 *
 * @param {{ history: object[] }} props oldest-first history rows
 */
export default function OrderStatusTimeline({ history = [] }) {
  if (!history.length) {
    return <p className="text-sm text-dark-500">No status history yet.</p>
  }

  // Render newest first.
  const rows = [...history].reverse()

  return (
    <ol className="relative border-l-2 border-dark-100 ml-3">
      {rows.map((entry, i) => {
        const { label, icon: Icon, dot } = getStatus(entry.to_status)
        const isLatest = i === 0
        return (
          <li key={entry.id ?? `${entry.to_status}-${entry.created_at}`} className="ml-6 pb-6 last:pb-0">
            <span
              className={`absolute -left-[13px] flex items-center justify-center w-6 h-6 rounded-full ring-4 ring-white ${dot} text-white`}
            >
              <Icon className="w-3.5 h-3.5" />
            </span>
            <div className="flex items-center gap-2">
              <p className={`text-sm font-semibold ${isLatest ? 'text-dark-900' : 'text-dark-700'}`}>
                {label}
              </p>
              {isLatest && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
                  Current
                </span>
              )}
            </div>
            {entry.from_status && (
              <p className="text-xs text-dark-500">
                Changed from {getStatus(entry.from_status).label}
              </p>
            )}
            {entry.note && <p className="text-xs text-dark-500 mt-0.5">“{entry.note}”</p>}
            <time className="text-xs text-dark-400">{formatWhen(entry.created_at)}</time>
          </li>
        )
      })}
    </ol>
  )
}
