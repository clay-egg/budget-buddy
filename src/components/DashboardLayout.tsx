import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  ChartBarIcon,
  CurrencyDollarIcon,
  HomeIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Add Expense', href: '/dashboard/add', icon: PlusIcon },
    { name: 'View Expenses', href: '/dashboard/expenses', icon: ChartBarIcon },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white shadow-lg">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 bg-primary-500">
            <CurrencyDollarIcon className="h-8 w-8 text-white" />
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
                className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="flex-shrink-0 p-4 border-t">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user.name ? user.name[0].toUpperCase() : user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user.name}
                </p>
              </div>
              <button
                onClick={signOut}
                className="ml-auto p-1 rounded-md text-gray-400 hover:text-gray-500"
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
        <div className="md:hidden bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-600"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold">Budget Buddy</span>
              {user?.name && (
                <span className="px-2 py-1 text-sm font-medium text-primary-700 bg-primary-100 rounded-full">
                  {user.name}
                </span>
              )}
            </div>
            <button 
              onClick={signOut} 
              className="text-gray-500 hover:text-gray-600 flex items-center"
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