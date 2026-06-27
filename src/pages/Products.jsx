import { useState, useEffect } from 'react'
import { Search, Plus, X, Edit2, Trash2, ChevronDown, Image as ImageIcon, Tag, Box } from 'lucide-react'
import { supabase } from '../lib/supabase'

const MOCK_PRODUCTS = [
  { id: '1', name: 'Handloom Cotton Saree', description: 'Beautiful handwoven cotton saree from Bangladesh', price: 2500, category_id: '1', stock: 45, image_url: '', status: 'active', created_at: '2024-01-15' },
  { id: '2', name: 'Organic Wild Honey', description: 'Pure organic honey from Sundarbans', price: 850, category_id: '2', stock: 120, image_url: '', status: 'active', created_at: '2024-01-20' },
  { id: '3', name: 'Terracotta Water Pot', description: 'Traditional clay water pot with intricate designs', price: 650, category_id: '3', stock: 30, image_url: '', status: 'active', created_at: '2024-02-01' },
  { id: '4', name: 'Bamboo Craft Basket', description: 'Handcrafted bamboo basket set for storage', price: 1200, category_id: '5', stock: 25, image_url: '', status: 'active', created_at: '2024-02-10' },
  { id: '5', name: 'Jute Shopping Bag', description: 'Eco-friendly jute bag with custom print', price: 450, category_id: '5', stock: 200, image_url: '', status: 'active', created_at: '2024-02-15' },
  { id: '6', name: 'Pure Mustard Oil', description: 'Cold-pressed pure mustard oil 1L', price: 280, category_id: '4', stock: 80, image_url: '', status: 'active', created_at: '2024-03-01' },
  { id: '7', name: 'Handmade Soap Set', description: 'Natural herbal soap set with essential oils', price: 550, category_id: '2', stock: 60, image_url: '', status: 'active', created_at: '2024-03-05' },
  { id: '8', name: 'Clay Dinner Set', description: 'Complete terracotta dinner set for 4', price: 3200, category_id: '3', stock: 15, image_url: '', status: 'inactive', created_at: '2024-03-10' },
]

const MOCK_CATEGORIES = [
  { id: '1', name: 'Apparel', description: 'Traditional clothing and fabrics' },
  { id: '2', name: 'Wellness', description: 'Organic and natural products' },
  { id: '3', name: 'Pottery', description: 'Clay and ceramic products' },
  { id: '4', name: 'Staples', description: 'Food items and essentials' },
  { id: '5', name: 'Handicrafts', description: 'Handmade crafts and decor' },
]

export default function Products() {
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [categories, setCategories] = useState(MOCK_CATEGORIES)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock: '',
    image_url: '',
    status: 'active',
  })

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [productsRes, categoriesRes] = await Promise.allSettled([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('name'),
        ])

        if (!cancelled) {
          if (productsRes.status === 'fulfilled' && productsRes.value.data && !productsRes.value.error) {
            setProducts(productsRes.value.data)
          }
          if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data && !categoriesRes.value.error) {
            setCategories(categoriesRes.value.data)
          }
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const payload = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
      category_id: parseInt(formData.category_id) || 0,
    }

    if (editingProduct) {
      const { error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', editingProduct.id)
      
      if (!error) {
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p))
      }
    } else {
      const { error } = await supabase
        .from('products')
        .insert([payload])
      
      if (!error) {
        setProducts([{ ...payload, id: Date.now().toString(), created_at: new Date().toISOString() }, ...products])
      }
    }
    
    setShowModal(false)
    setEditingProduct(null)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price?.toString() || '',
      category_id: product.category_id?.toString() || '',
      stock: product.stock?.toString() || '',
      image_url: product.image_url || '',
      status: product.status || 'active',
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (!error) {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(search.toLowerCase()) ||
      product.description?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || String(product.category_id) === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => String(c.id) === String(categoryId))
    return cat ? cat.name : 'Uncategorized'
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setFormData({ name: '', description: '', price: '', category_id: '', stock: '', image_url: '', status: 'active' })
    setShowModal(true)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Product Management</h2>
          <p className="text-dark-500">Manage products across all categories</p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Total Products</p>
              <p className="text-2xl font-bold text-dark-900">{products.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Active Products</p>
              <p className="text-2xl font-bold text-dark-900">{products.filter(p => p.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Box className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-dark-500">Categories</p>
              <p className="text-2xl font-bold text-dark-900">{categories.length}</p>
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
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input pr-10 appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id.toString()}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card p-12 text-center">
          <ImageIcon className="w-12 h-12 text-dark-300 mx-auto mb-3" />
          <p className="text-dark-500 font-medium">No products found</p>
          <p className="text-sm text-dark-400">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card group overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-dark-100 to-dark-200 flex items-center justify-center relative">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-dark-300" />
                )}
                <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {product.status}
                </span>
              </div>
              <div className="p-5">
                <span className="text-xs font-medium text-primary-600 mb-2 block">
                  {getCategoryName(product.category_id)}
                </span>
                <h3 className="font-bold text-dark-900 mb-1 group-hover:text-primary-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-dark-500 line-clamp-2 mb-3">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-lg font-bold text-gradient">৳{product.price?.toLocaleString()}</p>
                  <span className="text-xs text-dark-400">Stock: {product.stock}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 btn-secondary text-sm flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="btn-danger text-sm flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-dark-100">
              <h3 className="text-xl font-bold text-dark-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingProduct(null)
                }}
                className="p-2 rounded-lg hover:bg-dark-100 transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Handloom Saree"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[80px]"
                  placeholder="Product description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">Price (৳)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">Stock</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="input"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Category</label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="input"
                  placeholder="https://example.com/image.jpg"
                />
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
                    setEditingProduct(null)
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
