import { Bell, Search, Moon, Sun, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function Header() {
  const [darkMode, setDarkMode] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('karumart-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('karumart-theme', 'light')
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-dark-100">
      <div className="flex items-center justify-between px-8 py-4">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Admin Dashboard</h2>
          <p className="text-sm text-dark-500">Welcome back to KARUMART</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Search anything..."
              className="pl-10 pr-4 py-2.5 w-80 rounded-xl bg-dark-50 border border-dark-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>

          <button
            onClick={toggleDarkMode}
            className="p-2.5 rounded-xl bg-dark-50 hover:bg-dark-100 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5 text-dark-600" /> : <Moon className="w-5 h-5 text-dark-600" />}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl bg-dark-50 hover:bg-dark-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-dark-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-14 w-80 bg-white rounded-2xl shadow-xl border border-dark-100 p-4 animate-fade-in">
                <h3 className="font-semibold text-dark-900 mb-3">Notifications</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-dark-50 hover:bg-dark-100 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-dark-900">New order received</p>
                    <p className="text-xs text-dark-500 mt-1">2 minutes ago</p>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-50 hover:bg-dark-100 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-dark-900">Product stock low</p>
                    <p className="text-xs text-dark-500 mt-1">15 minutes ago</p>
                  </div>
                  <div className="p-3 rounded-xl bg-dark-50 hover:bg-dark-100 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-dark-900">New seller registered</p>
                    <p className="text-xs text-dark-500 mt-1">1 hour ago</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-50 hover:bg-dark-100 transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              A
            </div>
            <span className="font-medium text-dark-700">Admin</span>
            <ChevronDown className="w-4 h-4 text-dark-400" />
          </button>
        </div>
      </div>
    </header>
  )
}
