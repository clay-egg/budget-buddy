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

// Category colors mapping to match icon colors
const categoryColors: Record<string, string> = {
  'Food & Dining': '#F59E0B',    // amber-500
  'Transportation': '#10B981',   // emerald-500
  'Shopping': '#EC4899',         // pink-500
  'Entertainment': '#8B5CF6',    // violet-500
  'Bills & Utilities': '#3B82F6',// blue-500
  'Healthcare': '#EF4444',       // red-500
  'Education': '#6366F1',        // indigo-500
  'Travel': '#06B6D4',          // cyan-500
  'Business': '#6B7280',        // gray-500
  'Other': '#9CA3AF'            // gray-400
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
        firstDayOfWeek.setHours(0, 0, 0, 0);
        
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
      }
      
      // Update trends with the current time period
      await updateMonthlyTrends([], timePeriod);
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
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
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

  const updateMonthlyTrends = async (expenses: Expense[], period: 'week' | 'month' = 'month') => {
    if (!user) return;
    
    try {
      // Fetch all historical expenses for accurate trend calculation
      const { data: allExpenses, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) throw error;
      if (!allExpenses || allExpenses.length === 0) {
        setMonthlyData([]);
        return;
      }

      const dataMap = new Map<string, number>();
      const now = new Date();
      let labels: string[] = [];
      
      if (period === 'week') {
        // For weekly view, show last 7 days including today with month and day
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayNumber = date.getDate();
          const month = date.toLocaleString('default', { month: 'short' });
          const dayKey = `${month} ${dayNumber}`;
          days.push(dayKey);
          dataMap.set(dayKey, 0); // Initialize with 0 for each day
        }
        labels = days;
        
        // Calculate expenses for each day of the week
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 6); // 6 days ago + today = 7 days
        startOfWeek.setHours(0, 0, 0, 0);
        
        allExpenses.forEach(expense => {
          const expenseDate = new Date(expense.date);
          if (expenseDate >= startOfWeek) {
            const dayNumber = expenseDate.getDate();
            const month = expenseDate.toLocaleString('default', { month: 'short' });
            const dayKey = `${month} ${dayNumber}`;
            const current = dataMap.get(dayKey) || 0;
            dataMap.set(dayKey, current + expense.amount);
          }
        });
      } else {
        // For monthly view, show last 6 months including current month
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthKey = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
          months.push(monthKey);
          dataMap.set(monthKey, 0); // Initialize with 0 for each month
        }
        labels = months;
        
        // Calculate expenses for each month
        allExpenses.forEach(expense => {
          const expenseDate = new Date(expense.date);
          const monthKey = `${expenseDate.toLocaleString('default', { month: 'short' })} ${expenseDate.getFullYear()}`;
          if (dataMap.has(monthKey)) {
            const current = dataMap.get(monthKey) || 0;
            dataMap.set(monthKey, current + expense.amount);
          }
        });
      }
      
      // Convert map to array of { month, total } objects in the correct order
      const trendData = labels.map(label => ({
        month: label,
        total: dataMap.get(label) || 0
      }));
      
      setMonthlyData(trendData);
    } catch (error) {
      console.error('Error updating trend data:', error);
      setMonthlyData([]);
    }
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
        backgroundColor: categoryData.map(item => categoryColors[item.category] || '#6B7280'),
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

  // Add this helper function to format the date range
  const getWeekRange = () => {
    const today = new Date();
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());
    
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    
    return `${formatDate(firstDayOfWeek)} - ${formatDate(lastDayOfWeek)}`;
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
          <p className="text-gray-500">Here's an Overview of Your Spending</p>
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
            title: 'This Week ' + "(" +getWeekRange() +")",
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
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
          variants={item}
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {timePeriod === 'week' ? 'Weekly' : 'Monthly'} Budget
              </h2>
              <p className="text-sm text-gray-500">
                {timePeriod === 'week' 
                  ? getWeekRange()
                  : new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <motion.button 
              onClick={() => {
                setIsEditingBudget(true);
                setNewBudget(timePeriod === 'week' ? weeklyBudget.toString() : monthlyBudget.toString());
              }}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 flex items-center"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Set Limit
            </motion.button>
          </div>
          
          {isEditingBudget ? (
            <motion.form 
              onSubmit={updateMonthlyBudget} 
              className="mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">฿</span>
                  </div>
                  <input
                    type="number"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder={`Enter ${timePeriod === 'week' ? 'weekly' : 'monthly'} budget`}
                    step="1"
                    min="0"
                    autoFocus
                  />
                </div>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Save
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Spent: <span className="font-medium text-gray-800">{formatCurrency(timePeriod === 'week' ? expenses.thisWeek : expenses.thisMonth)}</span></span>
                <span>Limit: <span className="font-medium text-gray-800">{formatCurrency(timePeriod === 'week' ? weeklyBudget : monthlyBudget)}</span></span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-4">
                <motion.div 
                  className={`h-full rounded-full ${
                    budgetUsage > 90 ? 'bg-red-500' : 
                    budgetUsage > 70 ? 'bg-yellow-500' : 
                    'bg-blue-500'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${budgetUsage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Daily Average</span>
              <span className="text-sm font-semibold text-gray-800">{formatCurrency(dailyAverage)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Remaining</span>
              <span className={`text-sm font-semibold ${
                remainingBudget < (timePeriod === 'week' ? weeklyBudget : monthlyBudget) * 0.2 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
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
            <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
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
            <h2 className="text-lg font-semibold text-gray-900">
              Category Breakdown ({timePeriod === 'week' ? 'Week' : 'Month'})
            </h2>
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
            <h2 className="text-lg font-semibold text-gray-900">
              {timePeriod === 'week' ? 'Spending Trend (Last 7 Days)' : 'Monthly Spending Trend'}
            </h2>
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