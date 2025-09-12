import React from 'react'
import { Link } from 'react-router-dom'
import { 
  CurrencyDollarIcon, 
  PlusIcon, 
  ChartBarIcon,
  CalendarIcon 
} from '@heroicons/react/24/outline'

function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's an overview of your expenses.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-primary-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Expenses</div>
              <div className="text-2xl font-bold text-gray-900">\$0.00</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">This Month</div>
              <div className="text-2xl font-bold text-gray-900">\$0.00</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">This Week</div>
              <div className="text-2xl font-bold text-gray-900">\$0.00</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-semibold">#</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Entries</div>
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link to="/dashboard/add" className="card hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center p-6">
            <PlusIcon className="h-12 w-12 text-primary-500 group-hover:text-primary-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600">
                Add New Expense
              </h3>
              <p className="text-gray-500">Record a new expense quickly</p>
            </div>
          </div>
        </Link>

        <Link to="/dashboard/expenses" className="card hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center justify-center p-6">
            <ChartBarIcon className="h-12 w-12 text-green-500 group-hover:text-green-600" />
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600">
                View All Expenses
              </h3>
              <p className="text-gray-500">See all your recorded expenses</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Getting Started */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Getting Started</h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-primary-500 rounded-full"></div>
            </div>
            <p className="ml-3 text-sm text-gray-600">
              Add your first expense by clicking "Add New Expense"
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
            </div>
            <p className="ml-3 text-sm text-gray-600">
              View and manage your expenses in the "View All Expenses" section
            </p>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-gray-300 rounded-full"></div>
            </div>
            <p className="ml-3 text-sm text-gray-600">
              Track your spending patterns over time
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard