import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChartBarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)
  const { user, signOut, loading } = useAuth()
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Failed to sign out', error)
    } finally {
      setShowSignOutConfirm(false)
      setProfileMenuOpen(false)
    }
  }

  const openSignOutConfirm = () => {
    setShowSignOutConfirm(true)
    setProfileMenuOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'View Expenses', href: '/dashboard/expenses', icon: ChartBarIcon },
    { name: 'Add Expense', href: '/dashboard/add', icon: PlusIcon },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex">
      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <ArrowRightOnRectangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="mt-3 text-lg font-medium text-gray-900">Sign Out</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">Are you sure you want to sign out?</p>
              </div>
              <div className="mt-5 flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white shadow-lg border-r border-gray-100">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 bg-gradient-to-r from-primary-600 to-indigo-600">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <CurrencyDollarIcon className="h-5 w-5 text-white" />
            </div>
            <span className="ml-2 text-xl font-bold text-white">
              Budget Buddy
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors duration-200"
              >
                <item.icon className="mr-3 h-5 w-5 text-gray-500 group-hover:text-primary-600" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 p-4 border-t border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-primary-600 to-indigo-600 flex items-center justify-center text-white font-medium">
                  {user.name ? user.name[0].toUpperCase() : user.email?.[0]?.toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.name || user.email}
                </p>
              </div>
              <button
                onClick={openSignOutConfirm}
                className="ml-auto p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200"
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1">
        {/* Mobile header */}
        <div className="md:hidden bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-600 to-indigo-600 flex items-center justify-center">
                <CurrencyDollarIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
                Budget Buddy
              </span>
            </div>
            <button 
              onClick={openSignOutConfirm} 
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout