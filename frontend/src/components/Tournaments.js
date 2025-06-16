import React, { useState, useEffect } from 'react';
import { tournamentsAPI, courtsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import websocketService from '../services/websocket';

const Tournaments = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tournamentsRes, courtsRes] = await Promise.all([
          tournamentsAPI.getTournaments(),
          courtsAPI.getCourts(),
        ]);
        setTournaments(tournamentsRes.data);
        setCourts(courtsRes.data);
      } catch (error) {
        console.error('Error fetching tournaments data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time tournament updates
    if (websocketService.isConnected()) {
      websocketService.on('tournament_created', handleTournamentUpdate);
      websocketService.on('participant_registered', handleTournamentUpdate);
    }

    return () => {
      websocketService.off('tournament_created', handleTournamentUpdate);
      websocketService.off('participant_registered', handleTournamentUpdate);
    };
  }, []);

  const handleTournamentUpdate = (data) => {
    console.log('Tournament update received:', data);
    refreshTournaments();
  };

  const refreshTournaments = async () => {
    try {
      const response = await tournamentsAPI.getTournaments();
      setTournaments(response.data);
    } catch (error) {
      console.error('Error refreshing tournaments:', error);
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    if (activeTab === 'browse') return true;
    if (activeTab === 'my') return tournament.organizer_id === user?.id;
    if (activeTab === 'registered') return tournament.participants.includes(user?.id);
    return tournament.status === activeTab;
  });

  const handleRegisterForTournament = async (tournamentId) => {
    try {
      await tournamentsAPI.registerForTournament(tournamentId, {
        tournament_id: tournamentId,
        team_name: null,
        team_members: []
      });
      
      alert('✅ Successfully registered for tournament!');
      await refreshTournaments();
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      alert(`❌ Registration failed: ${errorMessage}`);
    }
  };

  const TournamentCard = ({ tournament }) => {
    const isRegistered = tournament.participants.includes(user?.id);
    const isOrganizer = tournament.organizer_id === user?.id;
    const canRegister = tournament.status === 'registration_open' && !isRegistered && !isOrganizer;
    const spotsLeft = tournament.max_participants - tournament.participants.length;

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{tournament.description}</p>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                tournament.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                tournament.status === 'registration_open' ? 'bg-green-100 text-green-800' :
                tournament.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                tournament.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                'bg-red-100 text-red-800'
              }`}>
                {tournament.status.replace('_', ' ')}
              </span>
              {tournament.live_streaming && (
                <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
                  🔴 Live Stream
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Format:</span>
              <span className="ml-2 text-gray-600 capitalize">{tournament.format.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Game Type:</span>
              <span className="ml-2 text-gray-600">{tournament.game_type}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Participants:</span>
              <span className="ml-2 text-gray-600">{tournament.participants.length}/{tournament.max_participants}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Entry Fee:</span>
              <span className="ml-2 text-gray-600">
                {tournament.entry_fee > 0 ? `$${tournament.entry_fee}` : 'Free'}
              </span>
            </div>
          </div>
          
          {tournament.prize_pool > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium text-yellow-800">💰 Prize Pool:</span>
                <span className="font-bold text-yellow-900">${tournament.prize_pool}</span>
              </div>
              {Object.keys(tournament.prize_distribution).length > 0 && (
                <div className="mt-2 text-xs text-yellow-700">
                  {Object.entries(tournament.prize_distribution).map(([place, amount]) => (
                    <span key={place} className="mr-3">
                      {place}: ${amount}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span>📅 {new Date(tournament.tournament_start).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>🕐 {new Date(tournament.tournament_start).toLocaleTimeString()}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {isOrganizer && (
                <span className="text-orange-600 font-medium text-sm">📋 Your Tournament</span>
              )}
              {isRegistered && !isOrganizer && (
                <span className="text-green-600 font-medium text-sm">✅ Registered</span>
              )}
              {spotsLeft <= 3 && spotsLeft > 0 && (
                <span className="text-red-600 font-medium text-sm">⚠️ {spotsLeft} spots left</span>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedTournament(tournament)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                View Details
              </button>
              {canRegister && (
                <button
                  onClick={() => handleRegisterForTournament(tournament.id)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  Register
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CreateTournamentModal = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      format: 'single_elimination',
      game_type: '5v5',
      max_participants: 16,
      entry_fee: 0,
      registration_start: '',
      registration_end: '',
      tournament_start: '',
      court_ids: [],
      rules: [],
      allow_spectators: true,
      is_public: true,
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await tournamentsAPI.createTournament({
          ...formData,
          registration_start: new Date(formData.registration_start).toISOString(),
          registration_end: new Date(formData.registration_end).toISOString(),
          tournament_start: new Date(formData.tournament_start).toISOString(),
        });
        
        setShowCreateModal(false);
        await refreshTournaments();
        alert('✅ Tournament created successfully!');
        
      } catch (error) {
        console.error('Error creating tournament:', error);
        alert('❌ Failed to create tournament');
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Tournament</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tournament Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Summer Championship 2025"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe your tournament..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    value={formData.format}
                    onChange={(e) => setFormData({...formData, format: e.target.value})}
                  >
                    <option value="single_elimination">Single Elimination</option>
                    <option value="double_elimination">Double Elimination</option>
                    <option value="round_robin">Round Robin</option>
                    <option value="swiss">Swiss</option>
                  </select>
                </div>
                
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
                    Max Participants
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="64"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({...formData, max_participants: parseInt(e.target.value)})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry Fee ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    value={formData.entry_fee}
                    onChange={(e) => setFormData({...formData, entry_fee: parseFloat(e.target.value) || 0})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Start
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    value={formData.registration_start}
                    onChange={(e) => setFormData({...formData, registration_start: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration End
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    value={formData.registration_end}
                    onChange={(e) => setFormData({...formData, registration_end: e.target.value})}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tournament Start
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    value={formData.tournament_start}
                    onChange={(e) => setFormData({...formData, tournament_start: e.target.value})}
                  />
                </div>
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
                  Create Tournament
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Basketball Tournaments</h1>
            <p className="text-gray-600">Compete in organized basketball tournaments</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            Create Tournament
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'browse', name: 'Browse All', icon: '🏆' },
              { id: 'registration_open', name: 'Open Registration', icon: '📝' },
              { id: 'in_progress', name: 'In Progress', icon: '⚡' },
              { id: 'my', name: 'My Tournaments', icon: '📋' },
              { id: 'registered', name: 'Registered', icon: '✅' },
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
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>

        {filteredTournaments.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl">🏆</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No tournaments found</h3>
            <p className="mt-2 text-gray-500">
              {activeTab === 'browse' ? 'Create the first tournament!' : `No ${activeTab.replace('_', ' ')} tournaments yet.`}
            </p>
          </div>
        )}

        {showCreateModal && <CreateTournamentModal />}
      </div>
    </Layout>
  );
};

export default Tournaments;