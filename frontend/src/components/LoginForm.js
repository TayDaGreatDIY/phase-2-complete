import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const LoginForm = ({ onToggleForm }) => {
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: 'mike@m2dg.com', // Pre-fill for demo
    password: 'password123',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData.email, formData.password);
    if (result.success) {
      window.location.href = '/';
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-3xl">🏀</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Welcome to M2DG Basketball
          </h2>
          <p className="mt-2 text-center text-sm text-orange-100">
            Sign in to your account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="text-orange-100 hover:text-white text-sm underline"
              onClick={onToggleForm}
            >
              Don't have an account? Sign up
            </button>
          </div>

          <div className="mt-6 bg-white bg-opacity-20 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-white font-semibold mb-2">Demo Accounts:</h3>
            <div className="space-y-1 text-sm text-orange-100">
              <div>🏀 Player: mike@m2dg.com / password123</div>
              <div>👨‍🏫 Coach: coach@m2dg.com / password123</div>
              <div>👑 Admin: admin@m2dg.com / admin123</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;