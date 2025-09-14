import {
  AcademicCapIcon,
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FilmIcon,
  GlobeAltIcon,
  HeartIcon,
  QuestionMarkCircleIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TruckIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { motion } from 'framer-motion';
import { JSX, useEffect, useMemo, useState } from 'react';
import { Doughnut, Line } from 'react-chartjs-2';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

// Category icons mapping
const categoryIcons: Record<string, JSX.Element> = {
  'Food & Dining': <ShoppingBagIcon className="h-5 w-5 text-yellow-500" />,
  'Transportation': <TruckIcon className="h-5 w-5 text-green-500" />,
  'Shopping': <ShoppingCartIcon className="h-5 w-5 text-pink-500" />,
  'Entertainment': <FilmIcon className="h-5 w-5 text-purple-500" />,
  'Bills & Utilities': <WifiIcon className="h-5 w-5 text-blue-500" />,
  'Healthcare': <HeartIcon className="h-5 w-5 text-red-500" />,
  'Education': <AcademicCapIcon className="h-5 w-5 text-indigo-500" />,
  'Travel': <GlobeAltIcon className="h-5 w-5 text-cyan-500" />,
  'Business': <BriefcaseIcon className="h-5 w-5 text-gray-600" />,
  'Other': <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />,
};

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState({
    total: 0,
    thisMonth: 0,
    thisWeek: 0
  });
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [categoryData, setCategoryData] = useState<{category: string; total: number}[]>([]);
  const [monthlyData, setMonthlyData] = useState<{month: string; total: number}[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(3000);
  const [weeklyBudget, setWeeklyBudget] = useState(750); // Default to 1/4 of monthly
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [isLoadingBudget, setIsLoadingBudget] = useState(true);
  const [timePeriod, setTimePeriod] = useState<'week' | 'month'>('month');

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchExpenses();
      fetchUserSettings();
    }
  }, [user, timePeriod]);

  const fetchExpenses = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      let startDate = new Date();
      
      if (timePeriod === 'week') {
        // For weekly view, get the start of the week
        startDate.setDate(today.getDate() - today.getDay());
      } else {
        // For monthly view, get the start of the month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      }
      
      // Fetch all expenses for the selected period
      const { data: periodExpenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString())
        .order('date', { ascending: false });

      if (error) throw error;

      // Fetch all expenses for the totals
      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id);

      if (allExpenses) {
        const total = allExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        // Calculate this month's expenses
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisMonthTotal = allExpenses
          .filter(exp => new Date(exp.date) >= firstDayOfMonth)
          .reduce((sum, exp) => sum + exp.amount, 0);
        
        // Calculate this week's expenses
        const firstDayOfWeek = new Date(today);
        firstDayOfWeek.setDate(today.getDate() - today.getDay());
        firstDayOfWeek.setHours(0, 0, 0, 0); // Normalize to start of day
        
        console.log('Debug - Today:', today);
        console.log('Debug - First day of week (Sunday):', firstDayOfWeek);
        console.log('Debug - All expenses to check:', allExpenses.map(e => ({
          date: e.date,
          amount: e.amount,
          isInThisWeek: new Date(e.date) >= firstDayOfWeek
        })));
        
        const thisWeekTotal = allExpenses
          .filter(exp => new Date(exp.date) >= firstDayOfWeek)
          .reduce((sum, exp) => sum + exp.amount, 0);
        
        setExpenses({
          total,
          thisMonth: thisMonthTotal,
          thisWeek: thisWeekTotal
        });
      }

      if (periodExpenses) {
        setRecentExpenses(periodExpenses.slice(0, 5));
        updateCategoryData(periodExpenses);
        updateMonthlyTrends(periodExpenses, timePeriod);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSettings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('monthly_budget, weekly_budget')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching user settings:', error);
        return;
      }

      if (data?.monthly_budget) {
        setMonthlyBudget(parseFloat(data.monthly_budget));
      }
      if (data?.weekly_budget) {
        setWeeklyBudget(parseFloat(data.weekly_budget));
      }
    } catch (error) {
      console.error('Error in fetchUserSettings:', error);
    } finally {
      setIsLoadingBudget(false);
    }
  };

  const updateMonthlyBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const budget = parseFloat(newBudget);
      if (isNaN(budget) || budget < 0) return;

      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            monthly_budget: timePeriod === 'month' ? budget : monthlyBudget,
            weekly_budget: timePeriod === 'week' ? budget : weeklyBudget,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      // Update the appropriate budget in state
      if (timePeriod === 'week') {
        setWeeklyBudget(budget);
      } else {
        setMonthlyBudget(budget);
      }
      
      setIsEditingBudget(false);
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const updateCategoryData = (expenses: Expense[]) => {
    const categoryMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      const current = categoryMap.get(expense.category) || 0;
      categoryMap.set(expense.category, current + expense.amount);
    });
    
    const sortedCategories = Array.from(categoryMap.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
    
    setCategoryData(sortedCategories);
  };

  const updateMonthlyTrends = (expenses: Expense[], period: 'week' | 'month' = 'month') => {
    const dataMap = new Map<string, number>();
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      let key: string;
      
      if (period === 'week') {
        // Group by day of week for weekly view
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        key = day;
      } else {
        // Group by month for monthly view
        key = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      }
      
      const current = dataMap.get(key) || 0;
      dataMap.set(key, current + expense.amount);
    });
    
    // Prepare labels and data in the correct order
    let labels: string[];
    
    if (period === 'week') {
      // Week days in order
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date().getDay();
      // Rotate the array so current day is last
      labels = [...days.slice(today + 1), ...days.slice(0, today + 1)];
    } else {
      // Last 6 months
      labels = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(`${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`);
      }
    }
    
    // Fill in the data, defaulting to 0 for missing periods
    const data = labels.map(label => dataMap.get(label) || 0);
    
    setMonthlyData(labels.map((label, i) => ({
      month: label,
      total: data[i]
    })));
  };

  // Calculate budget usage based on selected time period
  const budgetUsage = useMemo(() => {
    const spent = timePeriod === 'week' ? expenses.thisWeek : expenses.thisMonth;
    const budget = timePeriod === 'week' ? weeklyBudget : monthlyBudget; 
    return Math.min(Math.round((spent / budget) * 100), 100);
  }, [timePeriod, expenses.thisWeek, expenses.thisMonth, monthlyBudget, weeklyBudget]);

  // Calculate remaining budget based on selected time period
  const remainingBudget = useMemo(() => {
    const spent = timePeriod === 'week' ? expenses.thisWeek : expenses.thisMonth;
    const budget = timePeriod === 'week' ? weeklyBudget : monthlyBudget;
    return Math.max(budget - spent, 0);
  }, [timePeriod, expenses.thisWeek, expenses.thisMonth, monthlyBudget, weeklyBudget]);

  // Calculate daily average based on selected time period
  const dailyAverage = useMemo(() => {
    const spent = timePeriod === 'week' ? expenses.thisWeek : expenses.thisMonth;
    const days = timePeriod === 'week' ? 7 : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    return spent / days;
  }, [timePeriod, expenses.thisWeek, expenses.thisMonth]);

  // Chart data for category breakdown
  const categoryChartData = {
    labels: categoryData.map(item => item.category),
    datasets: [
      {
        data: categoryData.map(item => item.total),
        backgroundColor: [
          '#3B82F6', // blue-500
          '#10B981', // emerald-500
          '#F59E0B', // amber-500
          '#8B5CF6', // violet-500
          '#EC4899', // pink-500
          '#6B7280', // gray-500
          '#EF4444', // red-500
        ],
        borderWidth: 0,
      },
    ],
  };

  // Chart data for monthly trends
  const monthlyTrendData = {
    labels: monthlyData.map(item => item.month),
    datasets: [
      {
        label: 'Monthly Spending',
        data: monthlyData.map(item => item.total),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  // Chart options for line chart
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide legend for line chart
      },
    },
  };

  // Chart options for doughnut chart
  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,  
          boxHeight: 6, 
          padding: 15,   
          font: {
            size: 11    
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const dataset = data.datasets[0];
                const backgroundColor = Array.isArray(dataset.backgroundColor) 
                  ? dataset.backgroundColor[i] 
                  : dataset.backgroundColor;
                
                return {
                  text: label,
                  fillStyle: backgroundColor,
                  hidden: false,
                  lineCap: 'round',
                  lineDash: [],
                  lineDashOffset: 0,
                  lineJoin: 'round',
                  lineWidth: 1,
                  strokeStyle: backgroundColor,
                  pointStyle: 'circle',
                  rotation: 0
                };
              });
            }
            return [];
          }
        }
      },
    },
  };

  if (loading || isLoadingBudget) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="show"
      variants={container}
    >
      {/* Greeting and Stats */}
      <motion.div 
        className="flex justify-between items-center mb-6"
        variants={item}
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {user?.name || 'User'}</h1>
          <p className="text-gray-500">Here's an overview of your spending</p>
        </div>
        
        <motion.div 
          className="flex space-x-2 bg-gray-100 p-1 rounded-lg"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
          <button
            onClick={() => setTimePeriod('week')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              timePeriod === 'week'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimePeriod('month')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              timePeriod === 'month'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Month
          </button>
        </motion.div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={container}
      >
        {[
          {
            icon: <CurrencyDollarIcon className="h-6 w-6" />,
            title: 'Total Spent',
            value: formatCurrency(expenses.total),
            bg: 'bg-blue-100',
            text: 'text-blue-600'
          },
          {
            icon: <CalendarIcon className="h-6 w-6" />,
            title: 'This Month',
            value: formatCurrency(expenses.thisMonth),
            bg: 'bg-green-100',
            text: 'text-green-600'
          },
          {
            icon: <ClockIcon className="h-6 w-6" />,
            title: 'This Week',
            value: formatCurrency(expenses.thisWeek),
            bg: 'bg-purple-100',
            text: 'text-purple-600'
          }
        ].map((stat, index) => (
          <motion.div 
            key={index}
            className="bg-white p-6 rounded-lg shadow"
            variants={item}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
          >
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${stat.bg} ${stat.text}`}>
                {stat.icon}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={container}
      >
        {/* Top Categories */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow"
          variants={item}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Categories</h2>
          </div>
          <div className="space-y-4">
            {categoryData.slice(0, 5).map((category, index) => (
              <motion.div 
                key={category.category} 
                className="flex items-center justify-between"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ x: 5 }}
              >
                <div className="flex items-center">
                  <span className="mr-2">
                    {categoryIcons[category.category] || <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />}
                  </span>
                  <span className="text-sm text-gray-700">{category.category}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(category.total)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Monthly/Weekly Budget */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow"
          variants={item}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {timePeriod === 'week' ? 'Weekly' : 'Monthly'} Budget
            </h2>
            <motion.div 
              className="flex items-center"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-sm text-gray-500 mr-2">
                {timePeriod === 'week' 
                  ? 'This Week' 
                  : new Date().toLocaleString('default', { month: 'long' })}
              </span>
              <button 
                onClick={() => {
                  setIsEditingBudget(true);
                  setNewBudget(timePeriod === 'week' ? weeklyBudget.toString() : monthlyBudget.toString());
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </motion.div>
          </div>
          
          {isEditingBudget ? (
            <motion.form 
              onSubmit={updateMonthlyBudget} 
              className="mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center">
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-full p-2 border rounded-md mr-2"
                  placeholder={`Enter ${timePeriod === 'week' ? 'weekly' : 'monthly'} budget`}
                  step="0.01"
                  min="0"
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              className="mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Spent: {formatCurrency(timePeriod === 'week' ? expenses.thisWeek : expenses.thisMonth)}</span>
                <span>Budget: {formatCurrency(timePeriod === 'week' ? weeklyBudget : monthlyBudget)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <motion.div 
                  className={`h-2.5 rounded-full ${
                    budgetUsage > 80 ? 'bg-red-500' : 'bg-blue-600'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetUsage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
          
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Daily Average:</span>
              <span>{formatCurrency(dailyAverage)}</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining:</span>
              <span 
                className={`font-medium ${
                  remainingBudget < (timePeriod === 'week' ? weeklyBudget : monthlyBudget) * 0.2 
                    ? 'text-red-600' 
                    : 'text-gray-900'
                }`}
              >
                {formatCurrency(remainingBudget)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow"
          variants={item}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <motion.span whileHover={{ x: 5 }}>
              <Link 
                to="/dashboard/expenses" 
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            </motion.span>
          </div>
          <div className="space-y-4">
            {recentExpenses.slice(0, 3).length > 0 ? (
              recentExpenses.slice(0, 3).map((expense, index) => (
                <motion.div 
                  key={expense.id} 
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ x: 5, backgroundColor: 'rgba(249, 250, 251, 0.7)' }}
                  style={{ padding: '0.5rem', borderRadius: '0.5rem' }}
                >
                  <div className="flex items-center">
                    <div className="p-2 rounded-full bg-gray-100 text-gray-600 mr-3">
                      {categoryIcons[expense.category] || <QuestionMarkCircleIcon className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{expense.description || 'No description'}</div>
                      <div className="text-xs text-gray-500">{expense.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">-{formatCurrency(expense.amount)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                className="text-center text-sm text-gray-500 py-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                No recent transactions
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6"
        variants={container}
      >
        {/* Category Breakdown */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow"
          variants={item}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Category Breakdown</h2>
          </div>
          <div className="h-64">
            {categoryData.length > 0 ? (
              <Doughnut data={categoryChartData} options={doughnutChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No category data available
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow"
          variants={item}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Spending Trend</h2>
          </div>
          <div className="h-64">
            {monthlyData.length > 0 ? (
              <Line data={monthlyTrendData} options={lineChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No trend data available
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default Dashboard;