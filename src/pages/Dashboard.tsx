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
import { JSX, useEffect, useState } from 'react';
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

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchExpenseSummary(),
        fetchRecentExpenses(),
        fetchCategoryData(),
        fetchMonthlyTrends()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenseSummary = async () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const firstDayOfWeek = new Date(now);
    firstDayOfWeek.setDate(now.getDate() - now.getDay());
    firstDayOfWeek.setHours(0, 0, 0, 0);
    
    const { data: allExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user?.id);
    
    const { data: monthlyExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user?.id)
      .gte('date', firstDayOfMonth);
    
    const { data: weeklyExpenses } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', user?.id)
      .gte('date', firstDayOfWeek.toISOString());
    
    const total = allExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const thisMonth = monthlyExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    const thisWeek = weeklyExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    
    setExpenses({ total, thisMonth, thisWeek });
  };

  const fetchRecentExpenses = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user?.id)
      .order('date', { ascending: false })
      .limit(5);
    
    if (data) {
      setRecentExpenses(data);
    }
  };

  const fetchCategoryData = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('user_id', user?.id);
    
    if (data) {
      const categoryMap = new Map<string, number>();
      
      data.forEach(expense => {
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + expense.amount);
      });
      
      const sortedCategories = Array.from(categoryMap.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);
      
      setCategoryData(sortedCategories);
    }
  };

  const fetchMonthlyTrends = async () => {
    const { data } = await supabase
      .from('expenses')
      .select('date, amount')
      .eq('user_id', user?.id)
      .order('date', { ascending: true });
    
    if (data) {
      const monthlyMap = new Map<string, number>();
      
      data.forEach(expense => {
        const date = new Date(expense.date);
        const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
        const current = monthlyMap.get(monthYear) || 0;
        monthlyMap.set(monthYear, current + expense.amount);
      });
      
      const monthlyTrends = Array.from(monthlyMap.entries())
        .map(([month, total]) => ({ month, total }))
        .slice(-6); // Get last 6 months
      
      setMonthlyData(monthlyTrends);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting and Stats */}
      <div>
      <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {user?.name || 'User'}</h1>
        <p className="text-gray-500">Here's an overview of your spending</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Spent</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(expenses.total)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(expenses.thisMonth)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Week</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(expenses.thisWeek)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Categories */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Categories</h2>
          </div>
          <div className="space-y-4">
            {categoryData.slice(0, 5).map((category) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">
                    {categoryIcons[category.category] || <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" />}
                  </span>
                  <span className="text-sm text-gray-700">{category.category}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(category.total)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Budget */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Budget</h2>
            <span className="text-sm text-gray-500">
              {new Date().toLocaleString('default', { month: 'long' })}
            </span>
          </div>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Spent: {formatCurrency(expenses.thisMonth)}</span>
              <span>Budget: {formatCurrency(3000)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.min((expenses.thisMonth / 3000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Daily Average:</span>
              <span>{formatCurrency(expenses.thisMonth / new Date().getDate())}</span>
            </div>
            <div className="flex justify-between">
              <span>Remaining:</span>
              <span className="font-medium">
                {formatCurrency(Math.max(0, 3000 - expenses.thisMonth))}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link to="/expenses" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentExpenses.slice(0, 3).length > 0 ? (
              recentExpenses.slice(0, 3).map((expense) => (
                <div key={expense.id} className="flex items-center justify-between">
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
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-gray-500 py-4">
                No recent transactions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow">
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
        </div>

        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-lg shadow">
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
        </div>
      </div>
    </div>
  );
}

export default Dashboard;