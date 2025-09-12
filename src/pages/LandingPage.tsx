import React from 'react'
import { Link } from 'react-router-dom'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'

function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                ExpenseTracker
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-primary-500">
                Sign In
              </Link>
              <Link to="/login" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Take Control of Your
            <span className="text-primary-500"> Finances</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Track expenses, analyze spending patterns, and make informed 
            financial decisions with our simple expense tracker.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/login" className="btn-primary text-lg px-8 py-3">
              Start Free
            </Link>
            <button className="btn-secondary text-lg px-8 py-3">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Simple Expense Tracking
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to manage your expenses effectively
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="text-primary-500 mb-4 flex justify-center">
                <CurrencyDollarIcon className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Expenses</h3>
              <p className="text-gray-600">
                Easily record and categorize your daily expenses
              </p>
            </div>
            
            <div className="card text-center">
              <div className="text-primary-500 mb-4 flex justify-center">
                <CurrencyDollarIcon className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">View Reports</h3>
              <p className="text-gray-600">
                Get insights with detailed spending reports
              </p>
            </div>
            
            <div className="card text-center">
              <div className="text-primary-500 mb-4 flex justify-center">
                <CurrencyDollarIcon className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Stay Organized</h3>
              <p className="text-gray-600">
                Keep your finances organized and under control
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage