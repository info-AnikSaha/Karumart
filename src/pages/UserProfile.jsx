import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, ShoppingBag, Wallet, Clock, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useRealtimeOrders } from '../hooks/useRealtimeOrders'
import { fetchStatusHistory, summarizeItems } from '../lib/orders'
import OrderStatusBadge from '../components/OrderStatusBadge'
import OrderStatusTimeline from '../components/OrderStatusTimeline'

const ACTIVE_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery']

export default function UserProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const { orders, loading: loadingOrders } = useRealtimeOrders({ customerId: id })
  const [selectedId, setSelectedId] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    let active = true
    async function load() {
      setLoadingProfile(true)
      const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
      if (!active) return
      if (error) {
        console.error('Error loading profile:', error)
        setProfile({ id, full_name: 'Unknown User', email: '—', role: 'buyer', status: 'active' })
      } else {
        setProfile(data)
      }
      setLoadingProfile(false)
    }
    load()
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!selectedId) { setHistory([]); return }
    fetchStatusHistory(selectedId).then(setHistory).catch(() => setHistory([]))
  }, [selectedId])

  const stats = useMemo(() => {
    const total = orders.length
    const spend = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length
    const last = orders[0]?.created_at
    return { total, spend, active, last }
  }, [orders])

  if (loadingProfile) {
    return <div className="py-20 text-center text-dark-400">Loading profile...</div>
  }

  const initials = (profile.full_name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/users')}
          className="p-2 rounded-lg hover:bg-dark-100 text-dark-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-dark-900">User Profile</h2>
      </div>

      {/* Profile card */}
      <div className="card p-6 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-500/25">
          {initials}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-dark-900">{profile.full_name}</h3>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-primary-50 text-primary-700 capitalize">{profile.role}</span>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold capitalize ${profile.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-dark-100 text-dark-500'}`}>
              {profile.status}
            </span>
          </div>
          <div className="flex items-center gap-6 mt-2 text-sm text-dark-500">
            <span className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4" /> {profile.email}</span>
            {profile.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4" /> {profile.phone}</span>}
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={ShoppingBag} tone="from-blue-500 to-indigo-600" label="Total Orders" value={stats.total} />
        <StatTile icon={Wallet} tone="from-green-500 to-emerald-600" label="Total Spend" value={`৳${stats.spend.toLocaleString()}`} />
        <StatTile icon={Package} tone="from-purple-500 to-pink-600" label="Active Orders" value={stats.active} />
        <StatTile icon={Clock} tone="from-orange-500 to-amber-600" label="Last Order" value={stats.last ? new Date(stats.last).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order history */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="p-4 border-b border-dark-100">
            <h3 className="font-semibold text-dark-900">Order History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-100 bg-dark-50/50">
                  <th className="text-left py-3 px-6 text-sm font-semibold text-dark-500">Order #</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-dark-500">Items</th>
                  <th className="text-right py-3 px-6 text-sm font-semibold text-dark-500">Amount</th>
                  <th className="text-center py-3 px-6 text-sm font-semibold text-dark-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {loadingOrders ? (
                  <tr><td colSpan={4} className="py-10 text-center text-dark-400">Loading...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={4} className="py-10 text-center text-dark-400">No orders for this user.</td></tr>
                ) : orders.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedId(o.id)}
                    className={`border-b border-dark-50 cursor-pointer transition-colors ${selectedId === o.id ? 'bg-primary-50/50' : 'hover:bg-dark-50/30'}`}
                  >
                    <td className="py-3 px-6 text-sm font-medium text-dark-900">{o.order_number}</td>
                    <td className="py-3 px-6 text-sm text-dark-600">{summarizeItems(o.items)}</td>
                    <td className="py-3 px-6 text-sm font-semibold text-dark-900 text-right">৳{Number(o.total_amount).toLocaleString()}</td>
                    <td className="py-3 px-6 text-center"><OrderStatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected order timeline */}
        <div className="card p-6">
          <h3 className="font-semibold text-dark-900 mb-4">Tracking</h3>
          {!selectedId ? (
            <p className="text-sm text-dark-500">Select an order to see its tracking history.</p>
          ) : (
            <>
              <OrderStatusTimeline history={history} />
              <button
                onClick={() => navigate(`/orders/${selectedId}`)}
                className="w-full mt-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Open full order
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatTile({ icon: Icon, tone, label, value }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${tone} rounded-2xl flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-dark-500">{label}</p>
          <p className="text-2xl font-bold text-dark-900">{value}</p>
        </div>
      </div>
    </div>
  )
}
