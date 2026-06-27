import { useState, useEffect } from 'react'
import { Plus, X, Edit2, Trash2, FolderTree } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Error fetching categories:', error)
      setCategories([
        { id: '1', name: 'Apparel', description: 'Traditional clothing and fabrics', product_count: 450 },
        { id: '2', name: 'Wellness', description: 'Organic and natural products', product_count: 380 },
        { id: '3', name: 'Pottery', description: 'Clay and ceramic products', product_count: 320 },
        { id: '4', name: 'Staples', description: 'Food items and essentials', product_count: 290 },
        { id: '5', name: 'Handicrafts', description: 'Handmade crafts and decor', product_count: 250 },
      ])
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update(formData)
        .eq('id', editingCategory.id)
      
      if (error) {
        console.error('Error updating category:', error)
        setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } : c))
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert([formData])
      
      if (error) {
        console.error('Error creating category:', error)
        setCategories([...categories, { ...formData, id: Date.now().toString() }])
      }
    }
    
    setShowModal(false)
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting category:', error)
      setCategories(categories.filter(c => c.id !== id))
    }
  }

  const categoryColors = [
    'from-pink-500 to-rose-600',
    'from-purple-500 to-violet-600',
    'from-blue-500 to-indigo-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-amber-600',
    'from-red-500 to-pink-600',
    'from-cyan-500 to-teal-600',
    'from-indigo-500 to-purple-600',
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Category Management</h2>
          <p className="text-dark-500">Organize products into categories</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null)
            setFormData({ name: '', description: '' })
            setShowModal(true)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => (
            <div key={category.id} className="card p-6 group relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${categoryColors[index % categoryColors.length]}`}></div>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${categoryColors[index % categoryColors.length]} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <FolderTree className="w-7 h-7 text-white" />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-primary-600 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 rounded-lg hover:bg-red-50 text-dark-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-dark-900 mb-1">{category.name}</h3>
              <p className="text-sm text-dark-500 mb-4">{category.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-dark-100">
                <span className="text-xs text-dark-400 font-medium">Total Products</span>
                <span className="text-sm font-bold text-dark-900">{category.product_count || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-dark-100">
              <h3 className="text-xl font-bold text-dark-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingCategory(null)
                }}
                className="p-2 rounded-lg hover:bg-dark-100 transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Category Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Apparel"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Brief description of the category..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingCategory(null)
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
