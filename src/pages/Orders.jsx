import { useState, useEffect } from 'react'
import { Search, Filter, ChevronDown, Eye, X, Package, Truck, CheckCircle, XCircle } from 'lucide-react'

const mockOrders = [
  { id: 'ORD-001', customer: 'Rahim Ahmed', email: 'rahim@example.com', product: 'Handloom Cotton Saree', quantity: 1, amount: 2500, status: 'completed', date: '2024-01-15', address: 'Dhaka, Bangladesh' },
  { id: 'ORD-002', customer: 'Fatima Begum', email: 'fatima@example.com', product: 'Organic Wild Honey', quantity: 2, amount: 1700, status: 'processing', date: '2024-01-20', address: 'Chittagong, Bangladesh' },
  { id: 'ORD-003', customer: 'Karim Miah', email: 'karim@example.com', product: 'Bamboo Craft Basket', quantity: 1, amount: 1200, status: 'shipped', date: '2024-02-01', address: 'Sylhet, Bangladesh' },
  { id: 'ORD-004', customer: 'Nasrin Akter', email: 'nasrin@example.com', product: 'Terracotta Water Pot', quantity: 3, amount: 1950, status: 'completed', date: '2024-02-10', address: 'Rajshahi, Bangladesh' },
  { id: 'ORD-005', customer: 'Jamal Uddin', email: 'jamal@example.com', product: 'Jute Shopping Bag', quantity: 5, amount: 2250, status: 'cancelled', date: '2024-02-15', address: 'Khulna, Bangladesh' },
  { id: 'ORD-006', customer: 'Sultana Parvin', email: 'sultana@example.com', product: 'Handmade Soap Set', quantity: 2, amount: 1100, status: 'processing', date: '2024-03-01', address: 'Comilla, Bangladesh' },
  { id: 'ORD-007', customer: 'Mostafiz Rahman', email: 'mostafiz@example.com', product: 'Pure Mustard Oil', quantity: 4, amount: 1120, status: 'shipped', date: '2024-03-05', address: 'Rangpur, Bangladesh' },
  { id: 'ORD-008', customer: 'Rahima Khatun', email: 'rahima@example.com', product: 'Clay Dinner Set', quantity: 1, amount: 3200, status: 'completed', date: '2024-03-10', address: 'Dinajpur, Bangladesh' },
]

export default function Orders() {
  const [orders, setOrders] = useState(mockOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const handleView = (order) => {
    setSelectedOrder(order)
    setShowModal(true)
  }

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer?.toLowerCase().includes(search.toLowerCase()) ||
      order.id?.toLowerCase().includes(search.toLowerCase()) ||
      order.product?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    return styles[status] || 'bg-dark-100 text-dark-700'
  }

  const getStatusIcon = (status) => {
    if (status === 'completed') return <CheckCircle className="w-4 h-4" />
    if (status === 'processing') return <Package className="w-4 h-4" />
    if (status === 'shipped') return <Truck className="w-4 h-4" />
    return <XCircle className="w-4 h-4" />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Order Management</h2>
          <p className="text-dark-500">Track and manage customer orders</p>
        </div>
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
              <p className="text-sm text-dark-500">Completed</p>
              <p className="text-2xl font-bold text-dark-900">{orders.filter(o => o.status === 'completed').length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Shipped</p>
              <p className="text-2xl font-bold text-dark-900">{orders.filter(o => o.status === 'shipped').length}</p>
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
              <p className="text-2xl font-bold text-dark-900">{orders.filter(o => o.status === 'processing').length}</p>
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
              placeholder="Search orders..."
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
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
                <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Order ID</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Customer</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Product</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-dark-500">Amount</th>
                <th className="text-center py-4 px-6 text-sm font-semibold text-dark-500">Status</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Date</th>
                <th className="text-right py-4 px-6 text-sm font-semibold text-dark-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => (
                <tr key={order.id} className="border-b border-dark-50 hover:bg-dark-50/30 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-dark-900">{order.id}</td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-sm font-medium text-dark-900">{order.customer}</p>
                      <p className="text-xs text-dark-500">{order.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-dark-600">{order.product}</td>
                  <td className="py-4 px-6 text-sm font-semibold text-dark-900 text-right">
                    ৳{order.amount?.toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-dark-500">
                    {new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleView(order)}
                        className="p-2 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-primary-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {order.status === 'processing' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'shipped')}
                          className="p-2 rounded-lg hover:bg-purple-50 text-dark-400 hover:text-purple-600 transition-colors"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-dark-100">
              <h3 className="text-xl font-bold text-dark-900">Order Details</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedOrder(null)
                }}
                className="p-2 rounded-lg hover:bg-dark-100 transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-500">Order ID</span>
                <span className="font-semibold text-dark-900">{selectedOrder.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-500">Customer</span>
                <span className="font-medium text-dark-900">{selectedOrder.customer}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-500">Email</span>
                <span className="font-medium text-dark-900">{selectedOrder.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-500">Product</span>
                <span className="font-medium text-dark-900">{selectedOrder.product}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-500">Quantity</span>
                <span className="font-medium text-dark-900">{selectedOrder.quantity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-500">Amount</span>
                <span className="font-bold text-lg text-gradient">৳{selectedOrder.amount?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-500">Address</span>
                <span className="font-medium text-dark-900">{selectedOrder.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-500">Status</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  {selectedOrder.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-dark-500">Date</span>
                <span className="font-medium text-dark-900">
                  {new Date(selectedOrder.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
