import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { ExpenseCategory } from '../types/database'

function AddExpense() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: 'Other' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0]
  })

  const categories: ExpenseCategory[] = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Business',
    'Other'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!user) {
      setError('You must be logged in to add expenses')
      setLoading(false)
      return
    }

    // Validation
    if (!formData.amount || !formData.description) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      setLoading(false)
      return
    }

    try {
      const { error: insertError } = await supabase
        .from('expenses')
        .insert([
          {
            user_id: user.id,
            amount: amount,
            description: formData.description.trim(),
            category: formData.category,
            date: formData.date
          }
        ])

      if (insertError) throw insertError

      setSuccess(true)
      // Reset form
      setFormData({
        amount: '',
        description: '',
        category: 'Other',
        date: new Date().toISOString().split('T')[0]
      })

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard/expenses')
      }, 2000)

    } catch (err: any) {
      setError(err.message || 'Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Expense Added Successfully!</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your expense has been recorded. Redirecting to expenses page...
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add New Expense</h1>
        <p className="mt-1 text-sm text-gray-500">
          Record a new expense to track your spending.
        </p>
      </div>

      <div className="lg:flex lg:space-x-6">
        {/* Form Section */}
        <div className="lg:w-1/2">
          <div className="card">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="input-field pl-7"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="input-field resize-none"
                  placeholder="What did you spend money on?"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  name="category"
                  id="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  id="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="input-field"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Expense'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Quick Tips Section */}
        <div className="mt-6 lg:mt-0 lg:w-1/2">
          <div className="h-full flex flex-col">
            <div className="card flex-1 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-indigo-100 bg-white/50">
                <h3 className="text-xl font-semibold text-indigo-800">Quick Tips</h3>
              </div>
              <div className="p-6 space-y-4 flex-1 flex flex-col">
                <div className="flex items-start p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-medium text-sm mr-4">1</div>
                  <p className="text-gray-700 leading-relaxed">Be specific in your descriptions</p>
                </div>
                <div className="flex items-start p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium text-sm mr-4">2</div>
                  <p className="text-gray-700 leading-relaxed">Choose the right category</p>
                </div>
                <div className="flex items-start p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-medium text-sm mr-4">3</div>
                  <p className="text-gray-700 leading-relaxed">Add expenses regularly </p>
                </div>
                <div className="flex items-start p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-cyan-500 text-white flex items-center justify-center font-medium text-sm mr-4">4</div>
                  <p className="text-gray-700 leading-relaxed">Review your spending patterns weekly</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="mt-16 max-w-2xl mx-auto px-4">
        <div className="relative">
          <svg className="h-10 w-10 text-indigo-400 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          
          <blockquote className="text-center">
            <p className="text-xl text-gray-700 leading-relaxed font-light">
              "A budget is telling your money where to go instead of wondering where it went."
            </p>
            <footer className="mt-6">
              <p className="text-indigo-600 font-medium">John C. Maxwell</p>
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}

export default AddExpense