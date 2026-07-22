// Order number utilities — format KM-YYMMDD-NNNN
//
// The database (see supabase/migrations/0001_orders_tracking.sql) is the
// authoritative generator via a BEFORE INSERT trigger. These helpers are for
// the client: parsing, validation, and an offline/optimistic fallback.

const ORDER_NUMBER_RE = /^KM-(\d{2})(\d{2})(\d{2})-(\d{4})$/

/**
 * Validate a KaruMart order number.
 * @param {string} value
 * @returns {boolean}
 */
export function isValidOrderNumber(value) {
  return typeof value === 'string' && ORDER_NUMBER_RE.test(value.trim())
}

/**
 * Parse an order number into its parts.
 * @param {string} value e.g. "KM-260722-0042"
 * @returns {{ prefix: string, date: Date, year: number, month: number, day: number, seq: number } | null}
 */
export function parseOrderNumber(value) {
  if (typeof value !== 'string') return null
  const m = value.trim().match(ORDER_NUMBER_RE)
  if (!m) return null
  const [, yy, mm, dd, seq] = m
  const year = 2000 + Number(yy)
  const month = Number(mm)
  const day = Number(dd)
  return {
    prefix: 'KM',
    date: new Date(year, month - 1, day),
    year,
    month,
    day,
    seq: Number(seq),
  }
}

/**
 * Build an order number from a date + sequence.
 * @param {number} seq daily sequence (1-based)
 * @param {Date} [date] defaults to now
 * @returns {string}
 */
export function formatOrderNumber(seq, date = new Date()) {
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const nnnn = String(seq).padStart(4, '0')
  return `KM-${yy}${mm}${dd}-${nnnn}`
}
