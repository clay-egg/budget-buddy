import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Expense } from '../types/database'

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchExpenses = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchExpenses()
    }
  }, [user])

  const getSummary = (timeframe: 'week' | 'month' | 'year' = 'month') => {
    const now = new Date()
    let startDate = new Date()

    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    const filteredExpenses = expenses.filter(expense => 
      new Date(expense.date) >= startDate
    )

    const total = filteredExpenses.reduce((sum, expense) => 
      sum + parseFloat(expense.amount.toString()), 0
    )

    return {
      total,
      count: filteredExpenses.length,
      expenses: filteredExpenses
    }
  }

  return {
    expenses,
    loading,
    refetch: fetchExpenses,
    getSummary
  }
}