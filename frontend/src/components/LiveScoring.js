import React, { useState, useEffect } from 'react';
import { gamesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import websocketService from '../services/websocket';

const LiveScoring = () => {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameEvents, setGameEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoreForm, setScoreForm] = useState({
    team1_score: 0,
    team2_score: 0,
    game_time: '00:00',
    period: 1,
    event_description: ''
  });
  const [isScoring, setIsScoring] = useState(false);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const response = await gamesAPI.getGames(0, 100, 'in_progress');
        setGames(response.data);
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  useEffect(() => {
    if (selectedGame) {
      fetchGameEvents();
      joinGameSession();
      
      // Subscribe to real-time updates
      if (websocketService.isConnected()) {
        websocketService.subscribeToGame(selectedGame.id);
        websocketService.on('score_update', handleScoreUpdate);
        websocketService.on('user_joined', handleUserJoined);
      }

      // Initialize score form with current game score
      if (selectedGame.score) {
        setScoreForm(prev => ({
          ...prev,
          team1_score: selectedGame.score.team1 || 0,
          team2_score: selectedGame.score.team2 || 0
        }));
      }
    }

    return () => {
      if (selectedGame && websocketService.isConnected()) {
        websocketService.off('score_update', handleScoreUpdate);
        websocketService.off('user_joined', handleUserJoined);
      }
    };
  }, [selectedGame]);

  const fetchGameEvents = async () => {
    if (!selectedGame) return;
    
    try {
      const response = await gamesAPI.getGameEvents(selectedGame.id);
      setGameEvents(response.data);
    } catch (error) {
      console.error('Error fetching game events:', error);
    }
  };

  const joinGameSession = async () => {
    if (!selectedGame) return;
    
    try {
      await gamesAPI.joinGameSession(selectedGame.id, 'live_scoring');
    } catch (error) {
      console.error('Error joining game session:', error);
    }
  };

  const handleScoreUpdate = (data) => {
    console.log('Real-time score update:', data);
    
    // Update selected game score
    if (selectedGame && data.game_id === selectedGame.id) {
      setSelectedGame(prev => ({
        ...prev,
        score: {
          team1: data.team1_score,
          team2: data.team2_score
        }
      }));
      
      // Update score form
      setScoreForm(prev => ({
        ...prev,
        team1_score: data.team1_score,
        team2_score: data.team2_score,
        game_time: data.game_time,
        period: data.period
      }));
    }
    
    // Refresh events
    fetchGameEvents();
  };

  const handleUserJoined = (data) => {
    console.log('User joined game:', data);
    // Update live viewers count if needed
  };

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    setIsScoring(true);

    try {
      await gamesAPI.updateLiveScore(selectedGame.id, scoreForm);
      
      // Clear event description after successful update
      setScoreForm(prev => ({ ...prev, event_description: '' }));
      
    } catch (error) {
      console.error('Error updating score:', error);
      alert('❌ Failed to update score');
    } finally {
      setIsScoring(false);
    }
  };

  const quickScoreUpdate = (team, points) => {
    const newScore = team === 'team1' 
      ? { ...scoreForm, team1_score: scoreForm.team1_score + points }
      : { ...scoreForm, team2_score: scoreForm.team2_score + points };
    
    setScoreForm(newScore);
  };

  const GameCard = ({ game }) => (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300 cursor-pointer"
      onClick={() => setSelectedGame(game)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900">Game #{game.id.slice(-6)}</h3>
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
          game.status === 'in_progress' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {game.status.replace('_', ' ')}
        </span>
      </div>
      
      <div className="text-sm text-gray-600 mb-3">
        <p>Players: {game.players.length}</p>
        <p>Type: {game.game_type}</p>
        {game.live_viewers > 0 && (
          <p className="text-red-600">🔴 {game.live_viewers} watching</p>
        )}
      </div>
      
      {game.score && (
        <div className="bg-gray-50 rounded p-2">
          <div className="text-center">
            <span className="text-lg font-bold">
              {game.score.team1 || 0} - {game.score.team2 || 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Game Scoring</h1>
          <p className="text-gray-600">Real-time basketball game scoring and tracking</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Games List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="mr-2">⚡</span>
                Live Games
              </h2>
              
              <div className="space-y-4">
                {games.map((game) => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
              
              {games.length === 0 && (
                <div className="text-center py-8">
                  <span className="text-4xl">🏀</span>
                  <p className="text-gray-500 mt-2">No live games</p>
                </div>
              )}
            </div>
          </div>

          {/* Scoring Interface */}
          <div className="lg:col-span-2">
            {selectedGame ? (
              <div className="space-y-6">
                {/* Game Header */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                      Game #{selectedGame.id.slice(-6)}
                    </h2>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        👥 {selectedGame.live_viewers} watching
                      </span>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        selectedGame.status === 'in_progress' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedGame.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  {/* Current Score Display */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-center">
                        <h3 className="text-lg font-semibold">Team 1</h3>
                        <div className="text-4xl font-bold mt-2">
                          {selectedGame.score?.team1 || 0}
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-sm opacity-75">LIVE</div>
                        <div className="text-lg font-semibold">vs</div>
                      </div>
                      
                      <div className="text-center">
                        <h3 className="text-lg font-semibold">Team 2</h3>
                        <div className="text-4xl font-bold mt-2">
                          {selectedGame.score?.team2 || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scoring Controls */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Update</h3>
                  
                  <form onSubmit={handleUpdateScore} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team 1 Score
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => quickScoreUpdate('team1', -1)}
                            className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            min="0"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            value={scoreForm.team1_score}
                            onChange={(e) => setScoreForm({...scoreForm, team1_score: parseInt(e.target.value) || 0})}
                          />
                          <button
                            type="button"
                            onClick={() => quickScoreUpdate('team1', 1)}
                            className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => quickScoreUpdate('team1', 2)}
                            className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
                          >
                            +2
                          </button>
                          <button
                            type="button"
                            onClick={() => quickScoreUpdate('team1', 3)}
                            className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
                          >
                            +3
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Team 2 Score
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => quickScoreUpdate('team2', -1)}
                            className="bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
                          >
                            -1
                          </button>
                          <input
                            type="number"
                            min="0"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            value={scoreForm.team2_score}
                            onChange={(e) => setScoreForm({...scoreForm, team2_score: parseInt(e.target.value) || 0})}
                          />
                          <button
                            type="button"
                            onClick={() => quickScoreUpdate('team2', 1)}
                            className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
                          >
                            +1
                          </button>
                          <button
                            type="button"
                            onClick={() => quickScoreUpdate('team2', 2)}
                            className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
                          >
                            +2
                          </button>
                          <button
                            type="button"
                            onClick={() => quickScoreUpdate('team2', 3)}
                            className="bg-green-100 hover:bg-green-200 text-green-800 px-2 py-1 rounded"
                          >
                            +3
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Game Time
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                          value={scoreForm.game_time}
                          onChange={(e) => setScoreForm({...scoreForm, game_time: e.target.value})}
                          placeholder="MM:SS"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Period
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                          value={scoreForm.period}
                          onChange={(e) => setScoreForm({...scoreForm, period: parseInt(e.target.value)})}
                        >
                          <option value={1}>1st Quarter</option>
                          <option value={2}>2nd Quarter</option>
                          <option value={3}>3rd Quarter</option>
                          <option value={4}>4th Quarter</option>
                          <option value={5}>Overtime</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Description (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        value={scoreForm.event_description}
                        onChange={(e) => setScoreForm({...scoreForm, event_description: e.target.value})}
                        placeholder="e.g., 3-pointer by Player X"
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isScoring}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-md font-medium transition-colors"
                    >
                      {isScoring ? 'Updating...' : '🔄 Update Score'}
                    </button>
                  </form>
                </div>

                {/* Game Events */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Events</h3>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {gameEvents.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{event.description}</p>
                          <p className="text-sm text-gray-500">
                            {event.game_time} • {event.event_type}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {gameEvents.length === 0 && (
                    <div className="text-center py-8">
                      <span className="text-4xl">📋</span>
                      <p className="text-gray-500 mt-2">No events yet</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <span className="text-6xl">🏀</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Select a Game</h3>
                <p className="mt-2 text-gray-500">Choose a live game from the sidebar to start scoring</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LiveScoring;