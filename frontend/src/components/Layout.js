import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: '🏠' },
    { name: 'Courts', href: '/courts', icon: '🏀' },
    { name: 'Challenges', href: '/challenges', icon: '⚔️' },
    { name: 'Tournaments', href: '/tournaments', icon: '🏆' },
    { name: 'Store', href: '/store', icon: '🛍️' },
    { name: 'Coaches', href: '/coaches', icon: '👨‍🏫' },
    { name: 'RFID', href: '/rfid', icon: '📱' },
    { name: 'Live Scoring', href: '/live-scoring', icon: '⚡' },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo */}
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-white">🏀 M2DG</span>
              </div>
              
              {/* Desktop Navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {navigation.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-white hover:text-orange-200 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-3">
                  <div className="text-white text-sm">
                    <span className="font-medium">{user.full_name}</span>
                    <div className="text-orange-200 text-xs">
                      {user.skill_level} • ${user.wallet_balance}
                    </div>
                  </div>
                  <img
                    className="h-8 w-8 rounded-full border-2 border-white"
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=FF6B35&color=fff`}
                    alt={user.full_name}
                  />
                  <button
                    onClick={handleLogout}
                    className="text-white hover:text-orange-200 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="text-white hover:text-orange-200 inline-flex items-center justify-center p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-orange-600">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-white hover:text-orange-200 block px-3 py-2 rounded-md text-base font-medium flex items-center space-x-2"
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;