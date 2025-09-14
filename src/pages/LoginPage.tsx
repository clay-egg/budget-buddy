import { ArrowLeftIcon, ChartBarIcon, CurrencyDollarIcon, DevicePhoneMobileIcon, EyeIcon, EyeSlashIcon, ReceiptPercentIcon } from '@heroicons/react/24/outline'
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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
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
          setShowConfirmation(true)
          setMessage('A confirmation email has been sent to your email address. Please check your inbox and verify your email to continue.')
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
    setShowConfirmation(false)
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
            <motion.button
              onClick={() => navigate('/')}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group flex items-center text-gray-600 hover:text-primary-600 transition-all duration-200 mb-4 -ml-1"
            >
              <div className="p-1.5 rounded-full bg-gray-100 group-hover:bg-primary-50 transition-colors duration-200 mr-2">
                <ArrowLeftIcon className="h-4 w-4 text-gray-500 group-hover:text-primary-600 transition-colors duration-200" />
              </div>
              <span className="text-sm font-medium">Back to Home</span>
            </motion.button>
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

            {showConfirmation ? (
              <motion.div 
                className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-md text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Check your email</h3>
                <p className="text-sm text-blue-700 mb-4">
                  We've sent a confirmation link to <span className="font-medium">{form.email}</span>.
                </p>
                <p className="text-sm text-blue-700 mb-6">
                  Please click the link in the email to verify your account and complete your registration.
                </p>
                <div className="flex flex-col space-y-3">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
                  >
                    Didn't receive an email? Resend
                  </button>
                </div>
              </motion.div>
            ) : (
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
                  <motion.div variants={item} className="relative">
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
                  <motion.div variants={item} className="relative">
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      required
                      className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm pr-10"
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </motion.div>
                  {!isLogin && (
                    <motion.div variants={item} className="relative">
                      <label htmlFor="confirm-password" className="sr-only">
                        Confirm Password
                      </label>
                      <input
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        required={!isLogin}
                        className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm pr-10"
                        placeholder="Confirm Password"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
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
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isLogin ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      isLogin ? 'Sign in' : 'Sign up'
                    )}
                  </button>
                </motion.div>
              </form>
            )}
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