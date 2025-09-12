import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { CurrencyDollarIcon } from '@heroicons/react/24/outline'
// Import supabase directly for forgot password, as authStore might not have it exposed easily
import { supabase } from '../lib/supabase'; 

function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  // Added 'name' to the form state
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '' // Field for user's name during sign-up
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

    // Basic validation
    if (!form.email || !form.password) {
      setError('Please fill in all fields')
      return
    }

    if (!isLogin) { // Sign-up specific validations
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match')
        return
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      if (!form.name) { // Ensure name is filled for sign up
        setError('Please enter your name')
        return
      }
    }

    setLoading(true)

    try {
      if (isLogin) {
        // Sign In logic
        const { error } = await signIn(form.email, form.password)
        if (error) {
          setError(error.message)
        } else {
          navigate('/dashboard') // Redirect to dashboard on successful login
        }
      } else {
        // Sign Up logic - Pass name to the signUp function from AuthContext
        const { error } = await signUp(form.email, form.password, form.name)
        if (error) {
          setError(error.message)
        } else {
          // If signup is successful, show a message. 
          // Note: If email confirmations are ON, this message should reflect that.
          // With email confirmations OFF (as recommended for dev), user can sign in immediately.
          setMessage('Sign up successful! Please sign in to continue.')
          // Optionally clear form fields after successful signup message
          setForm({ email: '', password: '', confirmPassword: '', name: '' }); 
        }
      }
    } catch (err: any) { // Catch unexpected errors
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Toggles between login and sign-up form, and resets form fields
  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setMessage('')
    // Reset form fields to their default state when switching modes
    setForm({
      email: '',
      password: '',
      confirmPassword: '',
      name: '' 
    })
  }

  // Handles the forgot password functionality
  const handleForgotPassword = async () => {
    if (!form.email) {
      setError('Please enter your email address to reset your password')
      return
    }
    setLoading(true)
    setError('') // Clear previous errors
    setMessage('') // Clear previous messages

    try {
      // Use Supabase direct call for password reset
      const { error } = await supabase.auth.resetPasswordForEmail(form.email)
      if (error) {
        setError(error.message)
      } else {
        setMessage('Password reset email sent! Please check your inbox.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Section */}
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center mb-6">
            <CurrencyDollarIcon className="h-12 w-12 text-primary-500" />
            <span className="ml-2 text-2xl font-bold text-gray-900">ExpenseTracker</span>
          </Link>
          <h2 className="text-3xl font-bold text-gray-900">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={toggleMode}
              className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          {/* Error Message Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Success Message Display */}
          {message && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {message}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input - Only visible during sign-up */}
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Your full name"
                  required // Mark as required for sign-up
                />
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                className="input-field"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                className="input-field"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Confirm Password Input - Only visible during sign-up */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="input-field"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
              </button>
            </div>

            {/* Forgot Password Link - Only visible during sign-in */}
            {isLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Back to Home Link */}
        <div className="text-center">
          <Link to="/" className="text-primary-600 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage