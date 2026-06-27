import { 
  TrendingUp, 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts'

const stats = [
  {
    title: 'Total Revenue',
    value: '৳2,45,000',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
  },
  {
    title: 'Total Users',
    value: '12,450',
    change: '+8.2%',
    trend: 'up',
    icon: Users,
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Total Products',
    value: '3,890',
    change: '+23.1%',
    trend: 'up',
    icon: Package,
    color: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Total Orders',
    value: '8,640',
    change: '-2.4%',
    trend: 'down',
    icon: ShoppingCart,
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-50',
  },
]

const revenueData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 4500 },
  { name: 'May', value: 6000 },
  { name: 'Jun', value: 5500 },
]

const categoryData = [
  { name: 'Apparel', value: 40, color: '#d946ef' },
  { name: 'Wellness', value: 25, color: '#ec4899' },
  { name: 'Pottery', value: 20, color: '#f472b6' },
  { name: 'Staples', value: 10, color: '#f9a8d4' },
  { name: 'Handicrafts', value: 5, color: '#fbcfe8' },
]

const orderData = [
  { name: 'Mon', orders: 120 },
  { name: 'Tue', orders: 150 },
  { name: 'Wed', orders: 180 },
  { name: 'Thu', orders: 140 },
  { name: 'Fri', orders: 200 },
  { name: 'Sat', orders: 250 },
  { name: 'Sun', orders: 220 },
]

const recentOrders = [
  { id: 'ORD-001', customer: 'Rahim Ahmed', product: 'Handloom Cotton', amount: '৳1,200', status: 'Completed', date: '2 min ago' },
  { id: 'ORD-002', customer: 'Fatima Begum', product: 'Organic Honey', amount: '৳850', status: 'Processing', date: '15 min ago' },
  { id: 'ORD-003', customer: 'Karim Miah', product: 'Bamboo Craft', amount: '৳2,400', status: 'Shipped', date: '1 hour ago' },
  { id: 'ORD-004', customer: 'Nasrin Akter', product: 'Clay Pottery', amount: '৳650', status: 'Completed', date: '2 hours ago' },
  { id: 'ORD-005', customer: 'Jamal Uddin', product: 'Jute Bag', amount: '৳450', status: 'Cancelled', date: '3 hours ago' },
]

const topProducts = [
  { name: 'Handloom Cotton Saree', sales: 450, revenue: '৳2,25,000' },
  { name: 'Organic Honey 500g', sales: 380, revenue: '৳1,52,000' },
  { name: 'Bamboo Basket Set', sales: 320, revenue: '৳1,28,000' },
  { name: 'Clay Water Pot', sales: 290, revenue: '৳87,000' },
  { name: 'Jute Shopping Bag', sales: 250, revenue: '৳50,000' },
]

export default function Dashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="card p-6 group">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-sm text-dark-500 font-medium mb-1">{stat.title}</p>
              <h3 className="text-3xl font-bold text-dark-900 tracking-tight">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-dark-900">Revenue Overview</h3>
              <p className="text-sm text-dark-500">Monthly revenue statistics</p>
            </div>
            <button className="text-sm text-primary-600 font-medium hover:text-primary-700">View Report</button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="url(#colorRevenue)" 
                strokeWidth={3}
                dot={{ fill: '#d946ef', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-dark-900">Category Distribution</h3>
            <p className="text-sm text-dark-500">Products by category</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-4">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-dark-600">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-dark-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-dark-900">Daily Orders</h3>
            <p className="text-sm text-dark-500">This week's order statistics</p>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={orderData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="orders" fill="url(#colorOrders)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-dark-900">Top Products</h3>
            <Eye className="w-5 h-5 text-dark-400" />
          </div>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between pb-3 border-b border-dark-100 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl flex items-center justify-center font-bold text-primary-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-dark-900 text-sm">{product.name}</p>
                    <p className="text-xs text-dark-500">{product.sales} sales</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-dark-900">{product.revenue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-dark-900">Recent Orders</h3>
            <p className="text-sm text-dark-500">Latest transactions on the platform</p>
          </div>
          <button className="text-sm text-primary-600 font-medium hover:text-primary-700">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-100">
                <th className="text-left py-3 px-4 text-sm font-semibold text-dark-500">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-dark-500">Customer</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-dark-500">Product</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-dark-500">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-dark-500">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-dark-500">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order, index) => (
                <tr key={index} className="border-b border-dark-50 hover:bg-dark-50/50 transition-colors">
                  <td className="py-3 px-4 text-sm font-medium text-dark-900">{order.id}</td>
                  <td className="py-3 px-4 text-sm text-dark-600">{order.customer}</td>
                  <td className="py-3 px-4 text-sm text-dark-600">{order.product}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-dark-900">{order.amount}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-semibold ${
                      order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'Shipped' ? 'bg-purple-100 text-purple-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-dark-500">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
