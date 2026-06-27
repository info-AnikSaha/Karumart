import { useState, useEffect } from 'react'
import { Search, Plus, X, Edit2, Trash2, Shield, UserCheck, UserX, Filter, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Users() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    role: 'buyer',
    status: 'active',
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching users:', error)
      // Use mock data for demo
      setUsers([
        { id: '1', email: 'rahim@example.com', full_name: 'Rahim Ahmed', phone: '01712345678', role: 'seller', status: 'active', created_at: '2024-01-15' },
        { id: '2', email: 'fatima@example.com', full_name: 'Fatima Begum', phone: '01812345678', role: 'buyer', status: 'active', created_at: '2024-01-20' },
        { id: '3', email: 'karim@example.com', full_name: 'Karim Miah', phone: '01912345678', role: 'admin', status: 'active', created_at: '2024-02-01' },
        { id: '4', email: 'nasrin@example.com', full_name: 'Nasrin Akter', phone: '01612345678', role: 'seller', status: 'inactive', created_at: '2024-02-10' },
        { id: '5', email: 'jamal@example.com', full_name: 'Jamal Uddin', phone: '01512345678', role: 'logistics', status: 'active', created_at: '2024-02-15' },
        { id: '6', email: 'abul@example.com', full_name: 'Abul Kalam', phone: '01412345678', role: 'buyer', status: 'active', created_at: '2024-03-01' },
        { id: '7', email: 'sultana@example.com', full_name: 'Sultana Parvin', phone: '01798765432', role: 'seller', status: 'active', created_at: '2024-03-05' },
        { id: '8', email: 'mostafiz@example.com', full_name: 'Mostafizur Rahman', phone: '01898765432', role: 'admin', status: 'active', created_at: '2024-03-10' },
      ])
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (editingUser) {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', editingUser.id)
      
      if (error) {
        console.error('Error updating user:', error)
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u))
      }
    } else {
      const { error } = await supabase
        .from('profiles')
        .insert([formData])
      
      if (error) {
        console.error('Error creating user:', error)
        setUsers([{ ...formData, id: Date.now().toString(), created_at: new Date().toISOString() }, ...users])
      }
    }
    
    setShowModal(false)
    setEditingUser(null)
    setFormData({ email: '', full_name: '', phone: '', role: 'buyer', status: 'active' })
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      status: user.status,
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting user:', error)
      setUsers(users.filter(u => u.id !== id))
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'all' || user.role === filter
    return matchesSearch && matchesFilter
  })

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-700',
      seller: 'bg-blue-100 text-blue-700',
      buyer: 'bg-green-100 text-green-700',
      logistics: 'bg-orange-100 text-orange-700',
    }
    return styles[role] || 'bg-dark-100 text-dark-700'
  }

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-700' 
      : 'bg-red-100 text-red-700'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">User Management</h2>
          <p className="text-dark-500">Manage all users across the platform</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null)
            setFormData({ email: '', full_name: '', phone: '', role: 'buyer', status: 'active' })
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input pr-10 appearance-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="seller">Seller</option>
              <option value="buyer">Buyer</option>
              <option value="logistics">Logistics</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-100 bg-dark-50/50">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">User</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Phone</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Role</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Status</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-dark-500">Joined</th>
                  <th className="text-right py-4 px-6 text-sm font-semibold text-dark-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className="border-b border-dark-50 hover:bg-dark-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-dark-900">{user.full_name}</p>
                          <p className="text-xs text-dark-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-dark-600">{user.phone}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${getStatusBadge(user.status)}`}>
                        {user.status === 'active' ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-dark-500">
                      {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-primary-600 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-dark-100">
              <h3 className="text-xl font-bold text-dark-900">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingUser(null)
                }}
                className="p-2 rounded-lg hover:bg-dark-100 transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="input"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="01712345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="admin">Admin</option>
                  <option value="logistics">Logistics</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingUser(null)
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
