import { FunnelIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Expense, ExpenseCategory } from '../types/database'

function ExpensesList() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<{id: string, description: string} | null>(null)
  
  // Filters state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: ''
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

  // Effect to fetch expenses when user changes or filters are applied
  useEffect(() => {
    fetchExpenses()
  }, [user, filters]) // Re-fetch when user or filters change

  const fetchExpenses = async () => {
    if (!user) return // Don't fetch if no user is logged in

    setLoading(true)
    setError('')

    try {
      // Start with a base query selecting all fields from expenses
      // Filter by user_id and order by date descending
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      // Apply dynamic filters based on the 'filters' state
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.startDate) {
        query = query.gte('date', filters.startDate) // Greater than or equal to start date
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate)   // Less than or equal to end date
      }
      if (filters.minAmount) {
        // Ensure amount is parsed as float before applying filter
        query = query.gte('amount', parseFloat(filters.minAmount))
      }
      if (filters.maxAmount) {
        // Ensure amount is parsed as float before applying filter
        query = query.lte('amount', parseFloat(filters.maxAmount))
      }

      // Execute the query
      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError // Throw error if query fails

      setExpenses(data || []) // Update state with fetched expenses, or empty array if no data
    } catch (err: any) {
      setError(err.message || 'Failed to fetch expenses') // Set error message
    } finally {
      setLoading(false) // Always set loading to false
    }
  }

  const handleDelete = async (id: string) => {
    if (!expenseToDelete) return;
    
    setDeleteLoading(id)

    try {
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id)

      if (deleteError) throw deleteError

      // Remove the deleted expense from the local state
      setExpenses(expenses.filter(expense => expense.id !== id))
      setExpenseToDelete(null) // Close the dialog
    } catch (err: any) {
      setError(err.message || 'Failed to delete expense')
    } finally {
      setDeleteLoading(null)
    }
  }

  // Handler for changes in filter input fields
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value // Update the specific filter field
    }))
  }

  // Function to reset all filters to their default state
  const clearFilters = () => {
    setFilters({
      category: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: ''
    })
  }

  // Calculate total expenses from the currently filtered list
  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount.toString()), 0)
  // Check if any filters are currently active
  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  // Helper function to format numbers as USD currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Helper function to format dates nicely
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Show a loading spinner if data is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Expenses</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage all your expenses
          </p>
        </div>
        {/* Filter Button */}
        <div className="mt-4 sm:mt-0 flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)} // Toggle filter visibility
            className="btn-secondary flex items-center"
          >
            <FunnelIcon className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && ( // Show indicator if filters are active
              <span className="ml-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters Panel - Conditionally rendered */}
      {showFilters && (
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="input-field"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="input-field"
              />
            </div>

            {/* End Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="input-field"
              />
            </div>

            {/* Min Amount Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Amount
              </label>
              <input
                type="number"
                name="minAmount"
                value={filters.minAmount}
                onChange={handleFilterChange}
                className="input-field"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            {/* Max Amount Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Amount
              </label>
              <input
                type="number"
                name="maxAmount"
                value={filters.maxAmount}
                onChange={handleFilterChange}
                className="input-field"
                placeholder="1000.00"
                step="0.01"
                min="0"
              />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {expenseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Delete Expense</h3>
              <button
                onClick={() => setExpenseToDelete(null)}
                className="text-gray-400 hover:text-gray-500"
                disabled={!!deleteLoading}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{expenseToDelete.description}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                disabled={!!deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(expenseToDelete.id)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                disabled={!!deleteLoading}
              >
                {deleteLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </div>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Section */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Expenses Count */}
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {expenses.length}
            </div>
            <div className="text-sm text-gray-500">Total Entries</div>
          </div>
          {/* Total Amount */}
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="text-sm text-gray-500">Total Amount</div>
          </div>
          {/* Average Expense */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {expenses.length > 0 ? formatCurrency(totalExpenses / expenses.length) : '\$0.00'}
            </div>
            <div className="text-sm text-gray-500">Average</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Expenses List or Empty State */}
      {expenses.length === 0 ? (
        // Empty state message when no expenses are found
        <div className="card text-center py-12">
          <div className="text-gray-400 mb-4">
            {/* Empty list icon */}
            <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
          <p className="text-gray-500 mb-6">
            {hasActiveFilters ? 'Try adjusting your filters or' : 'Get started by'} adding your first expense.
          </p>
          {/* Button to add first expense */}
          <button
            onClick={() => window.location.href = '/dashboard/add'} // Direct navigation
            className="btn-primary"
          >
            Add Your First Expense
          </button>
        </div>
      ) : (
        // Render list of expenses if found
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div key={expense.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0"> {/* flex-1 allows description to take available space */}
                  {/* Expense Details Header */}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900 truncate"> {/* Truncate long descriptions */}
                      {expense.description}
                    </h3>
                    <div className="text-xl font-bold text-primary-600">
                      {formatCurrency(parseFloat(expense.amount.toString()))} {/* Format amount */}
                    </div>
                  </div>
                  {/* Expense Details Footer */}
                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <span className="bg-gray-100 px-2 py-1 rounded-full"> {/* Category tag */}
                      {expense.category}
                    </span>
                    <span>{formatDate(expense.date)}</span> {/* Formatted date */}
                  </div>
                </div>
                {/* Action Buttons (Edit/Delete) */}
                <div className="ml-4 flex items-center space-x-2">
                  {/* Edit Button - Currently a placeholder */}
                  <button
                    // onClick={() => {/* TODO: Implement edit functionality */} }
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    title="Edit expense"
                    disabled // Disable until edit functionality is added
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpenseToDelete({
                        id: expense.id,
                        description: expense.description || 'this expense'
                      });
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                    title="Delete expense"
                    disabled={!!deleteLoading}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExpensesList