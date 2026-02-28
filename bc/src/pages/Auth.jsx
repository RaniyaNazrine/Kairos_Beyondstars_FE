import { useState } from 'react'
import { FiMail, FiLock, FiUser } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
// motion is used in JSX tags but eslint sometimes flags it as unused
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import { auth } from '../lib/kairosClient'

const Auth = () => {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotSuccess, setForgotSuccess] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const resetErrors = () => setErrors({})

  const validateEmail = (value) => {
    if (!value) return 'Email is required'
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!re.test(value)) return 'Invalid email format'
    return ''
  }

  // ── FORGOT PASSWORD: send OTP email ──
  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    const emailErr = validateEmail(email)
    if (emailErr) {
      setErrors({ email: emailErr })
      setLoading(false)
      return
    }
    setErrors({})
    try {
      await auth.forgotPassword(email)
      setForgotSuccess(true)
      setMode('reset')
    } catch {
      // Always show success to prevent email enumeration
      setForgotSuccess(true)
      setMode('reset')
    }
    setLoading(false)
  }

  // ── RESET PASSWORD: verify OTP + set new password ──
  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    const newErrors = {}
    if (!otp.trim()) newErrors.otp = 'Reset code is required'
    if (newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters'
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      try {
        await auth.resetPassword({ email, otp: otp.trim(), new_password: newPassword })
        setErrors({ general: '' })
        switchMode('login')
      } catch (error) {
        const msg = error?.detail || error?.message || 'Invalid or expired reset code'
        setErrors({ general: msg })
      }
    }
    setLoading(false)
  }

  // ── SIGNUP: Kairos /auth/register → auto-login on success ──
  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    const newErrors = {}

    const emailErr = validateEmail(email)
    if (emailErr) newErrors.email = emailErr
    if (!displayName.trim()) newErrors.displayName = 'Display name is required'
    if (password.length < 8) newErrors.password = 'Password must be at least 8 characters'
    if (confirm !== password) newErrors.confirm = 'Passwords do not match'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      try {
        // 1) Create account on Kairos
        await auth.register({ email, password, display_name: displayName.trim() })

        // 2) Auto-login after successful signup (stores tokens in memory)
        await auth.login({ email, password })

        // Trigger navbar update
        window.dispatchEvent(new Event('kairos-auth'))

        // Redirect to home
        navigate('/')
      } catch (error) {
        const msg = error?.detail || error?.message || 'Registration failed. Please try again.'
        setErrors({ general: msg })
      }
    }

    setLoading(false)
  }

  // ── LOGIN: Kairos /auth/login → in-memory JWT + redirect ──
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const newErrors = {}

    if (!email) newErrors.email = 'Email is required'
    if (!password) newErrors.password = 'Password is required'

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      try {
        await auth.login({ email, password })

        // Trigger navbar update
        window.dispatchEvent(new Event('kairos-auth'))

        navigate('/')
      } catch (error) {
        const msg = error?.detail || error?.message || 'Invalid email or password'
        setErrors({ general: msg })
      }
    }

    setLoading(false)
  }

  const switchMode = (m) => {
    resetErrors()
    setLoading(false)
    setMode(m)
    setEmail('')
    setPassword('')
    setConfirm('')
    setDisplayName('')
    setOtp('')
    setNewPassword('')
    setForgotSuccess(false)
  }

  return (
    <div
      className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/food-bg.jpg')"
      }}
    >
      {/* dark overlay to improve readability */}
      <div className="absolute inset-0 bg-black/60 z-0" />
      <motion.div
        key="auth-card"
        className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 relative z-10 border border-white/20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div className="flex items-center justify-between mb-6" layout>
          <h2 className="text-xl font-semibold text-white">
            {mode === 'login' ? 'Login' : mode === 'signup' ? 'Sign Up' : mode === 'forgot' ? 'Reset Password' : 'Enter Reset Code'}
          </h2>
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => switchMode('login')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${mode === 'login' ? 'bg-yellow-400/20 text-yellow-300' : 'text-gray-300 hover:bg-white/10'}`}
              >
                Login
              </button>
              <button
                onClick={() => switchMode('signup')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition ${mode === 'signup' ? 'bg-yellow-400/20 text-yellow-300' : 'text-gray-300 hover:bg-white/10'}`}
              >
                Sign Up
              </button>
            </div>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <button onClick={() => switchMode('login')} className="text-sm text-gray-300 hover:text-white transition">
              ← Back to Login
            </button>
          )}
        </motion.div>

        {/* ── Forgot Password Form ── */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-gray-300">Enter your email and we'll send you a reset code.</p>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300"><FiMail /></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <div className="text-sm text-red-400 mt-1">{errors.email}</div>}
            </div>
            {errors.general && <div className="text-sm text-red-400">{errors.general}</div>}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 px-4 py-2.5 rounded-lg font-semibold shadow-2xl transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </motion.button>
          </form>
        )}

        {/* ── Reset Password (OTP) Form ── */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {forgotSuccess && (
              <div className="text-sm text-green-400 bg-green-400/10 border border-green-400/30 rounded-lg px-3 py-2">
                A reset code has been sent to <span className="font-semibold">{email}</span>.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">Reset Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm tracking-widest"
                placeholder="Enter code from email"
              />
              {errors.otp && <div className="text-sm text-red-400 mt-1">{errors.otp}</div>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-1">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300"><FiLock /></span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                  placeholder="New password (min 8 chars)"
                />
              </div>
              {errors.newPassword && <div className="text-sm text-red-400 mt-1">{errors.newPassword}</div>}
            </div>
            {errors.general && <div className="text-sm text-red-400">{errors.general}</div>}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 px-4 py-2.5 rounded-lg font-semibold shadow-2xl transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.03 }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </motion.button>
          </form>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className={`space-y-4 ${mode !== 'login' && mode !== 'signup' ? 'hidden' : ''}`}>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Email</label>
            <div className="relative">
              <motion.span
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <FiMail />
              </motion.span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <div className="text-sm text-red-400 mt-1">{errors.email}</div>}
          </div>

          <AnimatePresence exitBeforeEnter>
            {mode === 'signup' && (
              <motion.div
                key="displayname"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-200 mb-1">Display Name</label>
                <div className="relative">
                  <motion.span
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <FiUser />
                  </motion.span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                    placeholder="Your name"
                  />
                </div>
                {errors.displayName && <div className="text-sm text-red-400 mt-1">{errors.displayName}</div>}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Password</label>
            <div className="relative">
              <motion.span
                className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-300"
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <FiLock />
              </motion.span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                placeholder="Your password"
              />
            </div>
            {errors.password && <div className="text-sm text-red-400 mt-1">{errors.password}</div>}
          </div>

          <AnimatePresence exitBeforeEnter>
            {mode === 'signup' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <label className="block text-sm font-medium text-gray-200 mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm"
                  placeholder="Confirm password"
                />
                {errors.confirm && <div className="text-sm text-red-400 mt-1">{errors.confirm}</div>}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between">
            <AnimatePresence exitBeforeEnter>
              {mode === 'login' ? (
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm text-right w-full"
                >
                  <button type="button" onClick={() => { const e = email; switchMode('forgot'); setEmail(e) }} className="text-yellow-300 hover:text-yellow-200 transition">Forgot Password?</button>
                </motion.div>
              ) : (
                <motion.div key="empty" className="w-full" />
              )}
            </AnimatePresence>
          </div>

          {errors.general && <div className="text-sm text-red-400">{errors.general}</div>}

          <div>
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 px-4 py-2.5 rounded-lg font-semibold shadow-2xl transition-transform duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.03, boxShadow: loading ? 'none' : '0 0 20px rgba(250,204,21,0.6)' }}
              whileTap={{ scale: loading ? 1 : 0.97 }}
            >
              {loading ? (mode === 'login' ? 'Logging in...' : 'Creating Account...') : (mode === 'login' ? 'Login' : 'Create Account')}
            </motion.button>
          </div>
        </form>

        {(mode === 'login' || mode === 'signup') && (
          <motion.div className="text-center text-sm text-gray-300 mt-4" layout>
            {mode === 'login' ? (
              <>
                Don't have an account? <button onClick={() => switchMode('signup')} className="text-yellow-300 hover:text-yellow-200 transition font-semibold">Sign Up</button>
              </>
            ) : (
              <>
                Already have an account? <button onClick={() => switchMode('login')} className="text-yellow-300 hover:text-yellow-200 transition font-semibold">Login</button>
              </>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default Auth
