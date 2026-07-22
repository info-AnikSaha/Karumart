import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ChevronDown, Eye, X, Package, Truck, CheckCircle, Radio } from 'lucide-react'
import { useRealtimeOrders } from '../hooks/useRealtimeOrders'
import { ORDER_STATUS_LIST, allowedNext, getStatus, summarizeItems } from '../lib/orders'
import OrderStatusBadge from '../components/OrderStatusBadge'

export default function Orders() {
  const navigate = useNavigate()
  const { orders, loading, isLive, updateStatus } = useRealtimeOrders()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const handleView = (order) => {
    setSelectedOrder(order)
    setShowModal(true)
  }

  const handleAdvance = async (order) => {
    const next = allowedNext(order.status)[0]
    if (next) await updateStatus(order.id, next)
  }

  const filteredOrders = useMemo(() => orders.filter((order) => {
    const q = search.toLowerCase()
    const matchesSearch =
      order.customer_name?.toLowerCase().includes(q) ||
      order.order_number?.toLowerCase().includes(q) ||
      summarizeItems(order.items).toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  }), [orders, search, statusFilter])

  const countBy = (status) => orders.filter((o) => o.status === status).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Order Management</h2>
          <p className="text-dark-500">Track and manage customer orders</p>
        </div>
        {isLive && (
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
            <Radio className="w-4 h-4 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Total Orders</p>
              <p className="text-2xl font-bold text-dark-900">{orders.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Delivered</p>
              <p className="text-2xl font-bold text-dark-900">{countBy('delivered')}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-500">In Transit</p>
              <p className="text-2xl font-bold text-dark-900">{countBy('shipped') + countBy('out_for_delivery')}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Processing</p>
              <p className="text-2xl font-bold text-dark-900">{countBy('processing')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search by order #, customer, product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input pr-10 appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              {ORDER_STATUS_LIST.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-100 bg-dark-50/50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Order #</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Customer</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Items</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-dark-500">Amount</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-dark-500">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Date</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-dark-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-dark-400">Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-dark-400">No orders found.</td></tr>
              ) : filteredOrders.map((order) => {
                const next = allowedNext(order.status)[0]
                return (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="border-b border-dark-50 hover:bg-dark-50/30 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 text-sm font-medium text-dark-900">{order.order_number}</td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-medium text-dark-900">{order.customer_name}</p>
                        <p className="text-xs text-dark-500">{order.customer_email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-dark-600">{summarizeItems(order.items)}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-dark-900 text-right">
                      ৳{Number(order.total_amount)?.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="py-4 px-6 text-sm text-dark-500">
                      {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleView(order) }}
                          className="p-2 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-primary-600 transition-colors"
                          title="Quick view"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {next && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAdvance(order) }}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors"
                            title={`Advance to ${getStatus(next).label}`}
                          >
                            → {getStatus(next).label}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick-view Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-dark-100">
              <h3 className="text-xl font-bold text-dark-900">Order Details</h3>
              <button
                onClick={() => { setShowModal(false); setSelectedOrder(null) }}
                className="p-2 rounded-lg hover:bg-dark-100 transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Row label="Order #" value={selectedOrder.order_number} bold />
              <Row label="Customer" value={selectedOrder.customer_name} />
              <Row label="Email" value={selectedOrder.customer_email} />
              <Row label="Items" value={summarizeItems(selectedOrder.items)} />
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-500">Amount</span>
                <span className="font-bold text-lg text-gradient">৳{Number(selectedOrder.total_amount)?.toLocaleString()}</span>
              </div>
              <Row label="Ship to" value={selectedOrder.shipping_address} />
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-500">Status</span>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>
              <Row
                label="Date"
                value={new Date(selectedOrder.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              />
              <button
                onClick={() => { setShowModal(false); navigate(`/orders/${selectedOrder.id}`) }}
                className="w-full mt-2 py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors"
              >
                Open full tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-dark-500">{label}</span>
      <span className={`text-dark-900 ${bold ? 'font-semibold' : 'font-medium'}`}>{value}</span>
    </div>
  )
}
