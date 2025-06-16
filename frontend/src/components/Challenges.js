import React, { useState, useEffect } from 'react';
import { challengesAPI, courtsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';

const Challenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [challengesRes, courtsRes] = await Promise.all([
          challengesAPI.getChallenges(),
          courtsAPI.getCourts(),
        ]);
        setChallenges(challengesRes.data);
        setCourts(courtsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredChallenges = challenges.filter(challenge => {
    if (activeTab === 'all') return true;
    if (activeTab === 'my') return challenge.challenger_id === user?.id;
    if (activeTab === 'available') return challenge.status === 'pending' && challenge.challenger_id !== user?.id;
    return challenge.status === activeTab;
  });

  const handleAcceptChallenge = async (challengeId) => {
    try {
      await challengesAPI.acceptChallenge(challengeId);
      // Refresh challenges
      const response = await challengesAPI.getChallenges();
      setChallenges(response.data);
    } catch (error) {
      console.error('Error accepting challenge:', error);
      alert('Failed to accept challenge');
    }
  };

  const ChallengeCard = ({ challenge }) => {
    const court = courts.find(c => c.id === challenge.court_id);
    const isMyChallenge = challenge.challenger_id === user?.id;
    const canAccept = challenge.status === 'pending' && !isMyChallenge;
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{challenge.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
          </div>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            challenge.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            challenge.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
            challenge.status === 'completed' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {challenge.status}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center">
            <span className="font-medium text-gray-700">Game Type:</span>
            <span className="ml-2 text-gray-600">{challenge.game_type}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-700">Skill Level:</span>
            <span className="ml-2 text-gray-600 capitalize">{challenge.skill_level_required}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-700">Stakes:</span>
            <span className="ml-2 text-gray-600">
              {challenge.stakes > 0 ? `$${challenge.stakes}` : 'Free'}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-700">Court:</span>
            <span className="ml-2 text-gray-600">{court?.name || 'Unknown'}</span>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span>📅 {new Date(challenge.scheduled_time).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>🕐 {new Date(challenge.scheduled_time).toLocaleTimeString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm">
            {isMyChallenge ? (
              <span className="text-orange-600 font-medium">Your Challenge</span>
            ) : (
              <span className="text-gray-500">By another player</span>
            )}
          </div>
          
          {canAccept && (
            <button
              onClick={() => handleAcceptChallenge(challenge.id)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Accept Challenge
            </button>
          )}
          
          {challenge.status === 'completed' && challenge.winner_id && (
            <div className="flex items-center text-sm">
              <span className="text-yellow-500">🏆</span>
              <span className="ml-1 text-gray-600">Winner decided</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const CreateChallengeModal = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      court_id: '',
      skill_level_required: 'intermediate',
      stakes: 0,
      game_type: '1v1',
      scheduled_time: '',
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await challengesAPI.createChallenge({
          ...formData,
          scheduled_time: new Date(formData.scheduled_time).toISOString(),
        });
        
        // Refresh challenges
        const response = await challengesAPI.getChallenges();
        setChallenges(response.data);
        setShowCreateModal(false);
        
        // Reset form
        setFormData({
          title: '',
          description: '',
          court_id: '',
          skill_level_required: 'intermediate',
          stakes: 0,
          game_type: '1v1',
          scheduled_time: '',
        });
      } catch (error) {
        console.error('Error creating challenge:', error);
        alert('Failed to create challenge');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Create Challenge</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Challenge Title
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., 1v1 Championship Challenge"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Describe your challenge..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Court
                </label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  value={formData.court_id}
                  onChange={(e) => setFormData({...formData, court_id: e.target.value})}
                >
                  <option value="">Select a court</option>
                  {courts.map(court => (
                    <option key={court.id} value={court.id}>{court.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Game Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    value={formData.game_type}
                    onChange={(e) => setFormData({...formData, game_type: e.target.value})}
                  >
                    <option value="1v1">1v1</option>
                    <option value="2v2">2v2</option>
                    <option value="3v3">3v3</option>
                    <option value="5v5">5v5</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Skill Level
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    value={formData.skill_level_required}
                    onChange={(e) => setFormData({...formData, skill_level_required: e.target.value})}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stakes ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  value={formData.stakes}
                  onChange={(e) => setFormData({...formData, stakes: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({...formData, scheduled_time: e.target.value})}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-md transition-colors"
                >
                  Create Challenge
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Basketball Challenges</h1>
            <p className="text-gray-600">Create or accept challenges to test your skills</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Create Challenge
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'all', name: 'All Challenges' },
              { id: 'available', name: 'Available' },
              { id: 'my', name: 'My Challenges' },
              { id: 'accepted', name: 'Accepted' },
              { id: 'completed', name: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl">⚔️</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No challenges found</h3>
            <p className="mt-2 text-gray-500">
              {activeTab === 'all' ? 'Create the first challenge!' : `No ${activeTab} challenges yet.`}
            </p>
          </div>
        )}

        {showCreateModal && <CreateChallengeModal />}
      </div>
    </Layout>
  );
};

export default Challenges;