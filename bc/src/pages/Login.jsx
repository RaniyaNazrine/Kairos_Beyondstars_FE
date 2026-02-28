import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    // Basic placeholder handling - replace with real auth as needed
    if (username.trim() && password) {
      // For now, navigate to results after "login"
      navigate('/results')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-6 text-center">Sign in to continue to Beyond Stars</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Link to="#" className="text-sm text-primary-600 hover:underline">Forgot Password?</Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
              placeholder="Enter your password"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-white px-4 py-2 rounded-md font-semibold shadow-md hover:opacity-95 transition"
            >
              Log In
            </button>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account? <Link to="#" className="text-primary-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
