import { ArrowRightIcon, ChartBarIcon, CurrencyDollarIcon, DevicePhoneMobileIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setError('')
    setMessage('')

    if (!form.email || !form.password) {
      setError('Please fill in all fields')
      return
    }

    if (!isLogin) {
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      if (!form.name) {
        setError('Please enter your name')
        return
      }
    }

    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password)
        if (error) {
          setError(error.message)
        } else {
          navigate('/dashboard')
        }
      } else {
        const { error } = await signUp(form.email, form.password, form.name)
        if (error) {
          setError(error.message)
        } else {
          setMessage('Sign up successful! Please sign in to continue.')
          setForm({ email: '', password: '', confirmPassword: '', name: '' })
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setMessage('')
    setForm({
      email: '',
      password: '',
      confirmPassword: '',
      name: '' 
    })
  }

  const handleForgotPassword = async () => {
    if (!form.email) {
      setError('Please enter your email address to reset your password')
      return
    }
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email)
      if (error) {
        setError(error.message)
      } else {
        setMessage('Password reset email sent! Please check your inbox.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="flex min-h-screen">
        {/* Left side - Form */}
        <motion.div 
          className="flex-1 flex items-center justify-center p-8"
          initial="hidden"
          animate="show"
          variants={container}
        >
          <motion.div className="w-full max-w-md space-y-8" variants={item}>
            <div className="text-center">
              <motion.div 
                className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 flex items-center justify-center mb-4"
                whileHover={{ rotate: 5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <CurrencyDollarIcon className="h-8 w-8 text-white" />
              </motion.div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                {isLogin ? 'Sign in to your account' : 'Create a new account'}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={toggleMode}
                  className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>

            {error && (
              <motion.div 
                className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {message && (
              <motion.div 
                className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5V7h5V5H7a2 2 0 00-2 2v3a2 2 0 110 4h3a2 2 0 010 4H9a2 2 0 00-2-2V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">{message}</p>
                  </div>
                </div>
              </motion.div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm space-y-4">
                {!isLogin && (
                  <motion.div variants={item}>
                    <label htmlFor="name" className="sr-only">
                      Full name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required={!isLogin}
                      className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="Full name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </motion.div>
                )}
                <motion.div variants={item}>
                  <label htmlFor="email-address" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </motion.div>
                <motion.div variants={item}>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </motion.div>
                {!isLogin && (
                  <motion.div variants={item}>
                    <label htmlFor="confirm-password" className="sr-only">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      required={!isLogin}
                      className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                      placeholder="Confirm Password"
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    />
                  </motion.div>
                )}
              </div>

              <div className="flex items-center justify-between">
                {isLogin && (
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
              </div>

              <motion.div variants={item} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 ${
                    loading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <ArrowRightIcon className="h-5 w-5 text-primary-300 group-hover:text-primary-200" />
                    )}
                  </span>
                  {loading 
                    ? (isLogin ? 'Signing in...' : 'Creating account...')
                    : (isLogin ? 'Sign in' : 'Sign up')
                  }
                </button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>

        {/* Right side - Illustration */}
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary-50 to-indigo-50 p-12">
          <div className="max-w-md text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="w-32 h-32 mx-auto bg-gradient-to-r from-primary-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <CurrencyDollarIcon className="h-16 w-16 text-primary-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Welcome back!' : 'Join us today'}
              </h3>
              <p className="text-gray-600">
                {isLogin 
                  ? 'Sign in to access your personal finance dashboard.'
                  : 'Create an account and take control of your finances.'
                }
              </p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-2 gap-4 mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {[
                { icon: CurrencyDollarIcon, text: 'Track Expenses' },
                { icon: ChartBarIcon, text: 'Budgeting' },
                { icon: ReceiptPercentIcon, text: 'Reports' },
                { icon: DevicePhoneMobileIcon, text: 'Mobile Friendly' },
              ].map((feature, index) => (
                <motion.div 
                  key={feature.text}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                  whileHover={{ y: -4 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + (index * 0.1) }}
                >
                  <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-500 flex items-center justify-center">
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{feature.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage