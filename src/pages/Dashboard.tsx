import {
    CalendarIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    PlusIcon
} from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState({
    total: 0,
    thisMonth: 0,
    thisWeek: 0
  });

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      // Get current date and first/last day of month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      // Get first day of current week (Sunday)
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - now.getDay());
      firstDayOfWeek.setHours(0, 0, 0, 0);
      
      // Fetch all expenses
      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user?.id);
      
      // Fetch this month's expenses
      const { data: monthlyExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user?.id)
        .gte('date', firstDayOfMonth);
      
      // Fetch this week's expenses
      const { data: weeklyExpenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('user_id', user?.id)
        .gte('date', firstDayOfWeek.toISOString());
      
      // Calculate totals
      const total = allExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const thisMonth = monthlyExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      const thisWeek = weeklyExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
      
      setExpenses({ total, thisMonth, thisWeek });
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Function to get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}{user?.name ? `, ${user.name}` : ''}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {user?.name 
            ? `Welcome back to your expense dashboard`
            : 'Welcome back! Here\'s an overview of your expenses.'
          }
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-8 w-8 text-primary-500" />
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Expenses</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(expenses.total)}
              </div>
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
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(expenses.thisMonth)}
              </div>
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
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(expenses.thisWeek)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/dashboard/add"
          className="card hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 p-3 rounded-lg">
              <PlusIcon className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Expense</h3>
              <p className="mt-1 text-sm text-gray-500">
                Record a new expense transaction
              </p>
            </div>
          </div>
        </Link>

        <Link
          to="/dashboard/expenses"
          className="card hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">View All Expenses</h3>
              <p className="mt-1 text-sm text-gray-500">
                See and manage all your expenses
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;