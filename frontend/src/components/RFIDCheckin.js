import React, { useState, useEffect } from 'react';
import { rfidAPI, courtsAPI, presenceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import websocketService from '../services/websocket';

const RFIDCheckin = () => {
  const { user } = useAuth();
  const [rfidCards, setRfidCards] = useState([]);
  const [courts, setCourts] = useState([]);
  const [events, setEvents] = useState([]);
  const [presenceHistory, setPresenceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('checkin');
  const [formData, setFormData] = useState({
    cardUid: '',
    courtId: '',
    deviceId: 'WEB_APP'
  });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cardsRes, courtsRes, eventsRes, presenceRes] = await Promise.all([
          rfidAPI.getUserCards(user.id),
          courtsAPI.getCourts(),
          rfidAPI.getEvents(0, 20),
          presenceAPI.getUserPresenceHistory(user.id, 0, 20),
        ]);

        setRfidCards(cardsRes.data);
        setCourts(courtsRes.data);
        setEvents(eventsRes.data);
        setPresenceHistory(presenceRes.data);
      } catch (error) {
        console.error('Error fetching RFID data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Connect to WebSocket for real-time updates
    if (websocketService.isConnected()) {
      websocketService.on('player_checked_in', handleRealTimeUpdate);
      websocketService.on('player_checked_out', handleRealTimeUpdate);
    }

    return () => {
      websocketService.off('player_checked_in', handleRealTimeUpdate);
      websocketService.off('player_checked_out', handleRealTimeUpdate);
    };
  }, [user.id]);

  const handleRealTimeUpdate = (data) => {
    console.log('Real-time RFID update:', data);
    // Refresh events when real-time updates are received
    refreshEvents();
  };

  const refreshEvents = async () => {
    try {
      const eventsRes = await rfidAPI.getEvents(0, 20);
      setEvents(eventsRes.data);
    } catch (error) {
      console.error('Error refreshing events:', error);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await rfidAPI.checkIn(formData.cardUid, formData.courtId, formData.deviceId);
      
      alert(`✅ Check-in successful!\nWelcome to the court!`);
      
      // Refresh data
      await refreshEvents();
      const presenceRes = await presenceAPI.getUserPresenceHistory(user.id, 0, 20);
      setPresenceHistory(presenceRes.data);
      
      // Clear form
      setFormData({ ...formData, cardUid: '', courtId: '' });
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Check-in failed';
      alert(`❌ Check-in failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const response = await rfidAPI.checkOut(formData.cardUid, formData.courtId, formData.deviceId);
      
      alert(`✅ Check-out successful!\nThanks for playing!`);
      
      // Refresh data
      await refreshEvents();
      const presenceRes = await presenceAPI.getUserPresenceHistory(user.id, 0, 20);
      setPresenceHistory(presenceRes.data);
      
      // Clear form
      setFormData({ ...formData, cardUid: '', courtId: '' });
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Check-out failed';
      alert(`❌ Check-out failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">RFID Court Check-in</h1>
          <p className="text-gray-600">Manage your court access with RFID cards</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'checkin', name: 'Check-in/Out', icon: '📱' },
              { id: 'cards', name: 'My RFID Cards', icon: '💳' },
              { id: 'history', name: 'History', icon: '📋' },
              { id: 'events', name: 'Recent Events', icon: '⚡' },
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

        {/* Check-in/Out Tab */}
        {activeTab === 'checkin' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">📱</span>
                RFID Court Access
              </h2>

              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select RFID Card
                  </label>
                  <select
                    value={formData.cardUid}
                    onChange={(e) => setFormData({ ...formData, cardUid: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="">Choose your RFID card</option>
                    {rfidCards.map((card) => (
                      <option key={card.id} value={card.card_uid}>
                        {card.card_uid} ({card.card_type}) - Access Level {card.access_level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Court
                  </label>
                  <select
                    value={formData.courtId}
                    onChange={(e) => setFormData({ ...formData, courtId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    required
                  >
                    <option value="">Choose a court</option>
                    {courts.map((court) => (
                      <option key={court.id} value={court.id}>
                        {court.name} - {court.location}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={!formData.cardUid || !formData.courtId || isProcessing}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-md font-medium transition-colors"
                  >
                    {isProcessing ? 'Processing...' : '✅ Check In'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleCheckOut}
                    disabled={!formData.cardUid || !formData.courtId || isProcessing}
                    className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-md font-medium transition-colors"
                  >
                    {isProcessing ? 'Processing...' : '❌ Check Out'}
                  </button>
                </div>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">How it works:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Select your RFID card and target court</li>
                  <li>• Click Check In when you arrive at the court</li>
                  <li>• Click Check Out when you're leaving</li>
                  <li>• Your presence will be tracked in real-time</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* RFID Cards Tab */}
        {activeTab === 'cards' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rfidCards.map((card) => (
                <div key={card.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">💳 RFID Card</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      card.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {card.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Card UID:</span>
                      <span className="ml-2 font-mono text-gray-900">{card.card_uid}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="ml-2 capitalize text-gray-900">{card.card_type}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Access Level:</span>
                      <span className="ml-2 text-gray-900">{card.access_level}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Issued:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(card.issued_date).toLocaleDateString()}
                      </span>
                    </div>
                    {card.expiry_date && (
                      <div>
                        <span className="font-medium text-gray-700">Expires:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(card.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {rfidCards.length === 0 && (
              <div className="text-center py-12">
                <span className="text-6xl">💳</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No RFID Cards</h3>
                <p className="mt-2 text-gray-500">Contact an administrator to get your RFID card.</p>
              </div>
            )}
          </div>
        )}

        {/* Presence History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Your Presence History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Court
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {presenceHistory.map((presence) => {
                      const court = courts.find(c => c.id === presence.court_id);
                      const duration = presence.check_out_time 
                        ? Math.round((new Date(presence.check_out_time) - new Date(presence.check_in_time)) / (1000 * 60))
                        : null;
                      
                      return (
                        <tr key={presence.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {court ? court.name : 'Unknown Court'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(presence.check_in_time).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {presence.check_out_time 
                              ? new Date(presence.check_out_time).toLocaleString()
                              : 'Still present'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {duration ? `${duration} minutes` : 'Ongoing'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {presence.current_activity || 'General'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              presence.status === 'checked_in' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {presence.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {presenceHistory.length === 0 && (
              <div className="text-center py-12">
                <span className="text-6xl">📋</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No History</h3>
                <p className="mt-2 text-gray-500">Your court presence history will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div className="space-y-4">
              {events.map((event) => {
                const court = courts.find(c => c.id === event.court_id);
                return (
                  <div key={event.id} className="bg-white rounded-lg shadow-md p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          event.success ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <h3 className="font-medium text-gray-900 flex items-center">
                            {event.event_type === 'check_in' && '✅ Check In'}
                            {event.event_type === 'check_out' && '❌ Check Out'}
                            {event.event_type === 'access_granted' && '🔓 Access Granted'}
                            {event.event_type === 'access_denied' && '🔒 Access Denied'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {court ? court.name : 'Unknown Court'} • {event.card_uid}
                          </p>
                          {event.error_message && (
                            <p className="text-sm text-red-600">{event.error_message}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                        {event.device_id && (
                          <p className="text-xs text-gray-400">{event.device_id}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {events.length === 0 && (
              <div className="text-center py-12">
                <span className="text-6xl">⚡</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Recent Events</h3>
                <p className="mt-2 text-gray-500">RFID events will appear here as they happen.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RFIDCheckin;