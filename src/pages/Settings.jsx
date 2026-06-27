import { useState, useEffect } from 'react'
import { Save, Bell, Shield, Palette, Globe, Monitor, Moon, Sun, Check } from 'lucide-react'

function applyTheme(theme) {
  const root = document.documentElement
  const stored = localStorage.getItem('karumart-theme')

  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (systemDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

function applyPrimaryColor(color) {
  const root = document.documentElement
  root.setAttribute('data-theme', color)
  localStorage.setItem('karumart-primary-color', color)
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [theme, setTheme] = useState('light')
  const [primaryColor, setPrimaryColor] = useState('purple')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const storedTheme = localStorage.getItem('karumart-theme') || 'light'
    const storedColor = localStorage.getItem('karumart-primary-color') || 'purple'
    setTheme(storedTheme)
    setPrimaryColor(storedColor)
    applyTheme(storedTheme)
    applyPrimaryColor(storedColor)

    const handler = () => {
      const t = localStorage.getItem('karumart-theme') || 'light'
      const c = localStorage.getItem('karumart-primary-color') || 'purple'
      setTheme(t)
      setPrimaryColor(c)
      applyTheme(t)
      applyPrimaryColor(c)
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    localStorage.setItem('karumart-theme', newTheme)
    applyTheme(newTheme)
  }

  const handleColorChange = (color) => {
    setPrimaryColor(color)
    applyPrimaryColor(color)
  }

  const handleSaveGeneral = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  const themeOptions = [
    { id: 'light', label: 'Light', Icon: Sun },
    { id: 'dark', label: 'Dark', Icon: Moon },
    { id: 'system', label: 'System', Icon: Monitor },
  ]

  const colorOptions = [
    { id: 'purple', label: 'Purple', gradient: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { id: 'blue', label: 'Blue', gradient: 'bg-gradient-to-r from-blue-500 to-indigo-500' },
    { id: 'green', label: 'Green', gradient: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { id: 'orange', label: 'Orange', gradient: 'bg-gradient-to-r from-orange-500 to-amber-500' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-dark-900">Settings</h2>
        <p className="text-dark-500">Manage your admin panel preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card p-2">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'text-dark-600 hover:bg-dark-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'general' && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-dark-900 mb-6">General Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">Site Name</label>
                  <input
                    type="text"
                    defaultValue="KARUMART"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">Site Description</label>
                  <textarea
                    className="input min-h-[80px]"
                    defaultValue="Deshi Ponno Bisostho Aungina - D2C E-commerce Platform"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">Support Email</label>
                  <input
                    type="email"
                    defaultValue="support@karumart.com"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">Contact Number</label>
                  <input
                    type="tel"
                    defaultValue="+880 1234-567890"
                    className="input"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveGeneral}
                    className="btn-primary flex items-center gap-2"
                  >
                    {saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                    {saved ? 'Saved!' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-dark-900 mb-6">Appearance</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-3">Theme Mode</label>
                  <div className="grid grid-cols-3 gap-4">
                    {themeOptions.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleThemeChange(option.id)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                          theme === option.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-dark-200 hover:border-dark-300'
                        }`}
                      >
                        <option.Icon className={`w-6 h-6 ${theme === option.id ? 'text-primary-600' : 'text-dark-400'}`} />
                        <span className={`text-sm font-medium ${theme === option.id ? 'text-primary-700' : 'text-dark-600'}`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-3">Primary Color</label>
                  <div className="flex gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.id}
                        onClick={() => handleColorChange(color.id)}
                        className={`w-12 h-12 rounded-full ${color.gradient} border-2 transition-all hover:scale-110 ${
                          primaryColor === color.id ? 'border-dark-900 ring-2 ring-dark-900 ring-offset-2' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-dark-900 mb-6">Notification Settings</h3>
              <div className="space-y-4">
                {[
                  { title: 'New Orders', desc: 'Receive notifications for new orders', enabled: true },
                  { title: 'User Registrations', desc: 'Notify when new users register', enabled: true },
                  { title: 'Low Stock Alerts', desc: 'Get alerted when products are running low', enabled: true },
                  { title: 'System Updates', desc: 'Important platform updates and maintenance', enabled: false },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-dark-50 rounded-xl">
                    <div>
                      <p className="font-medium text-dark-900">{item.title}</p>
                      <p className="text-sm text-dark-500">{item.desc}</p>
                    </div>
                    <button className={`relative w-12 h-6 rounded-full transition-colors ${item.enabled ? 'bg-primary-500' : 'bg-dark-300'}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${item.enabled ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-dark-900 mb-6">Security Settings</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-dark-900 mb-2">Change Password</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">Current Password</label>
                      <input type="password" className="input" placeholder="Enter current password" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">New Password</label>
                      <input type="password" className="input" placeholder="Enter new password" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-dark-700 mb-2">Confirm New Password</label>
                      <input type="password" className="input" placeholder="Confirm new password" />
                    </div>
                    <button className="btn-primary">Update Password</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
