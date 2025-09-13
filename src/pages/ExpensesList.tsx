import { FunnelIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Expense, ExpenseCategory } from '../types/database'

// Color mapping for categories to match the doughnut chart
const categoryColors: Record<string, string> = {
  'Food & Dining': 'bg-amber-200 text-amber-900',
  'Transportation': 'bg-emerald-200 text-emerald-900',
  'Shopping': 'bg-pink-200 text-pink-900',
  'Entertainment': 'bg-violet-200 text-violet-900',
  'Bills & Utilities': 'bg-blue-200 text-blue-900',
  'Healthcare': 'bg-red-200 text-red-900',
  'Education': 'bg-indigo-200 text-indigo-900',
  'Travel': 'bg-cyan-200 text-cyan-900',
  'Business': 'bg-gray-200 text-gray-900',
  'Other': 'bg-gray-300 text-gray-900'
};

type SortField = 'date' | 'amount' | 'category' | 'description' | ''
type SortDirection = 'asc' | 'desc'

function ExpensesList() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<{id: string, description: string} | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [editFormData, setEditFormData] = useState({
    description: '',
    amount: '',
    category: '',
    date: ''
  })
  const [editLoading, setEditLoading] = useState(false)
  const navigate = useNavigate()
  
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

  // Add sort state
  const [sortConfig, setSortConfig] = useState<{
    field: SortField
    direction: SortDirection
  }>({
    field: 'date',
    direction: 'desc' // Default: newest first
  })

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

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense)
    setEditFormData({
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date.split('T')[0] // Format date for date input
    })
  }

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExpense || !user) return

    setEditLoading(true)
    
    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          description: editFormData.description.trim(),
          amount: parseFloat(editFormData.amount),
          category: editFormData.category as ExpenseCategory,
          date: editFormData.date,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingExpense.id)
        .eq('user_id', user.id)

      if (error) throw error

      // Update local state
      setExpenses(expenses.map(exp => 
        exp.id === editingExpense.id 
          ? { 
              ...exp, 
              ...editFormData, 
              amount: parseFloat(editFormData.amount),
              date: editFormData.date 
            } 
          : exp
      ))
      
      setEditingExpense(null)
      setEditFormData({ description: '', amount: '', category: '', date: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to update expense')
    } finally {
      setEditLoading(false)
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

  // Sort expenses based on sortConfig
  const sortedExpenses = useMemo(() => {
    const sortableExpenses = [...expenses]
    if (!sortConfig.field) return sortableExpenses

    return sortableExpenses.sort((a, b) => {
      let aValue, bValue
      
      switch (sortConfig.field) {
        case 'date':
          aValue = new Date(a.date).getTime()
          bValue = new Date(b.date).getTime()
          break
        case 'amount':
          aValue = parseFloat(a.amount.toString())
          bValue = parseFloat(b.amount.toString())
          break
        case 'category':
        case 'description':
          aValue = a[sortConfig.field].toLowerCase()
          bValue = b[sortConfig.field].toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [expenses, sortConfig])

  // Handle sort change
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: 
        prev.field === field && prev.direction === 'desc' 
          ? 'asc' 
          : 'desc'
    }))
  }

  // Helper to get sort indicator
  const getSortIndicator = (field: SortField) => {
    if (sortConfig.field !== field) return null
    return sortConfig.direction === 'asc' ? '↑' : '↓'
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
    <div className="flex flex-col min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Expenses</h1>
            <p className="mt-1 text-sm text-gray-500">
              Track and manage all your expenses
            </p>
          </div>
          
          {/* Filter and Sort Controls */}
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
            <div className="flex gap-3">
              {/* Sort Dropdown */}
              <div className="w-full sm:w-48">
                <select
                  id="sort"
                  value={`${sortConfig.field}:${sortConfig.direction}`}
                  onChange={(e) => {
                    const [field, direction] = e.target.value.split(':')
                    setSortConfig({
                      field: field as SortField,
                      direction: direction as SortDirection
                    })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
                >
                  <option value="date:desc">Newest First</option>
                  <option value="date:asc">Oldest First</option>
                  <option value="amount:desc">Amount (High to Low)</option>
                  <option value="amount:asc">Amount (Low to High)</option>
                  <option value="category:asc">Category (A-Z)</option>
                  <option value="category:desc">Category (Z-A)</option>
                  <option value="description:asc">Description (A-Z)</option>
                  <option value="description:desc">Description (Z-A)</option>
                </select>
              </div>
              
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center whitespace-nowrap"
              >
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>
            </div>
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

        {/* Summary Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="card flex-1">
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
            {sortedExpenses.map((expense) => (
              <div key={expense.id} className="card hover:shadow-lg transition-shadow p-4">
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
                    <div className="flex items-center text-sm space-x-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[expense.category] || 'bg-gray-100 text-gray-800'}`}>
                        {expense.category}
                      </span>
                      <span className="text-gray-500">{formatDate(expense.date)}</span>
                    </div>
                  </div>
                  {/* Action Buttons (Edit/Delete) */}
                  <div className="ml-4 flex items-center space-x-2">
                    {/* Edit Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(expense);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="Edit expense"
                      disabled={!!deleteLoading}
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

      {/* Modals */}
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

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit Expense</h3>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-gray-400 hover:text-gray-500"
                disabled={editLoading}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={editFormData.amount}
                        onChange={handleEditFormChange}
                        step="0.01"
                        min="0.01"
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={editFormData.date}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={editFormData.category}
                    onChange={handleEditFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExpensesList