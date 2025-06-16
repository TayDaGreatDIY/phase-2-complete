import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { courtsAPI, challengesAPI, usersAPI, statsAPI } from '../services/api';
import Layout from './Layout';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    courts: [],
    challenges: [],
    recentUsers: [],
    userStats: [],
    loading: true,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [courtsRes, challengesRes, usersRes, statsRes] = await Promise.all([
          courtsAPI.getCourts(0, 5),
          challengesAPI.getChallenges(0, 5, 'pending'),
          usersAPI.getUsers(0, 5),
          user ? statsAPI.getUserStats(user.id) : Promise.resolve({ data: [] }),
        ]);

        setDashboardData({
          courts: courtsRes.data,
          challenges: challengesRes.data,
          recentUsers: usersRes.data,
          userStats: statsRes.data,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchDashboardData();
  }, [user]);

  const statsCards = [
    {
      title: 'Total Games',
      value: user?.total_games || 0,
      icon: '🏀',
      color: 'bg-blue-500',
    },
    {
      title: 'Win Rate',
      value: user?.total_games > 0 ? `${Math.round((user.wins / user.total_games) * 100)}%` : '0%',
      icon: '🏆',
      color: 'bg-green-500',
    },
    {
      title: 'Rating',
      value: Math.round(user?.rating || 1200),
      icon: '⭐',
      color: 'bg-yellow-500',
    },
    {
      title: 'Wallet',
      value: `$${user?.wallet_balance || 0}`,
      icon: '💰',
      color: 'bg-purple-500',
    },
  ];

  if (dashboardData.loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.full_name}! 🏀
            </h1>
            <p className="text-orange-100">
              Ready to dominate the court? Check out the latest challenges and courts below.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} rounded-md p-3`}>
                      <span className="text-2xl">{stat.icon}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Challenges */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <span className="mr-2">⚔️</span>
                Active Challenges
              </h3>
            </div>
            <div className="p-6">
              {dashboardData.challenges.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.challenges.map((challenge) => (
                    <div key={challenge.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-900">{challenge.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                            <span>🏀 {challenge.game_type}</span>
                            <span>📊 {challenge.skill_level_required}</span>
                            {challenge.stakes > 0 && <span>💰 ${challenge.stakes}</span>}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          challenge.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {challenge.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl">🏀</span>
                  <p className="text-gray-500 mt-2">No active challenges</p>
                  <a href="/challenges" className="text-orange-600 hover:text-orange-500 text-sm font-medium mt-2 inline-block">
                    Browse all challenges →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Popular Courts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <span className="mr-2">🏟️</span>
                Popular Courts
              </h3>
            </div>
            <div className="p-6">
              {dashboardData.courts.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.courts.map((court) => (
                    <div key={court.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{court.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{court.location}</p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                            <div className="flex items-center">
                              <span className="text-yellow-400">⭐</span>
                              <span className="ml-1">{court.rating}</span>
                            </div>
                            <span>🏠 {court.surface_type}</span>
                            {court.hourly_rate > 0 && <span>💰 ${court.hourly_rate}/hr</span>}
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className="text-sm text-gray-500">
                            {court.current_players.length}/{court.max_players} 👥
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <span className="text-4xl">🏟️</span>
                  <p className="text-gray-500 mt-2">No courts available</p>
                  <a href="/courts" className="text-orange-600 hover:text-orange-500 text-sm font-medium mt-2 inline-block">
                    Explore courts →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Community Activity */}
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
              <span className="mr-2">👥</span>
              Community Activity
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {dashboardData.recentUsers.map((recentUser) => (
                <div key={recentUser.id} className="text-center">
                  <img
                    className="mx-auto h-12 w-12 rounded-full"
                    src={recentUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(recentUser.full_name)}&background=FF6B35&color=fff`}
                    alt={recentUser.full_name}
                  />
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900">{recentUser.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{recentUser.skill_level}</p>
                    <div className="flex items-center justify-center mt-1">
                      <span className="text-yellow-400 text-xs">⭐</span>
                      <span className="text-xs text-gray-500 ml-1">{Math.round(recentUser.rating)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;