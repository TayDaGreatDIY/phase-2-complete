import React, { useState, useEffect } from 'react';
import { courtsAPI } from '../services/api';
import Layout from './Layout';

const Courts = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourt, setSelectedCourt] = useState(null);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const response = await courtsAPI.getCourts();
        setCourts(response.data);
      } catch (error) {
        console.error('Error fetching courts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourts();
  }, []);

  const CourtCard = ({ court }) => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48">
        <img
          src={court.images[0] || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800'}
          alt={court.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            court.booking_required ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
          }`}>
            {court.booking_required ? 'Booking Required' : 'Drop-in'}
          </span>
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="flex items-center text-white">
            <span className="text-yellow-400">⭐</span>
            <span className="ml-1 text-sm font-medium">{court.rating}</span>
            <span className="ml-1 text-sm">({court.total_ratings})</span>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{court.name}</h3>
          {court.hourly_rate > 0 && (
            <span className="text-lg font-bold text-orange-600">${court.hourly_rate}/hr</span>
          )}
        </div>
        
        <p className="text-gray-600 text-sm mb-3">{court.description}</p>
        
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <span className="mr-4">📍 {court.location}</span>
          <span className="mr-4">🏠 {court.surface_type}</span>
          {court.lighting && <span className="mr-4">💡 Lighting</span>}
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {court.amenities.slice(0, 4).map((amenity, index) => (
            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              {amenity}
            </span>
          ))}
          {court.amenities.length > 4 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
              +{court.amenities.length - 4} more
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium">{court.current_players.length}/{court.max_players}</span> players
          </div>
          <button
            onClick={() => setSelectedCourt(court)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  const CourtModal = ({ court, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="relative">
          <img
            src={court.images[0] || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800'}
            alt={court.name}
            className="w-full h-64 object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{court.name}</h2>
              <p className="text-gray-600">{court.location}</p>
            </div>
            {court.hourly_rate > 0 && (
              <div className="text-right">
                <span className="text-2xl font-bold text-orange-600">${court.hourly_rate}</span>
                <span className="text-gray-500">/hour</span>
              </div>
            )}
          </div>
          
          <p className="text-gray-700 mb-4">{court.description}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-900">Surface:</span>
              <span className="ml-2 text-gray-600 capitalize">{court.surface_type}</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-900">Capacity:</span>
              <span className="ml-2 text-gray-600">{court.max_players} players</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-900">Currently:</span>
              <span className="ml-2 text-gray-600">{court.current_players.length} players</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="font-medium text-gray-900">Rating:</span>
              <div className="ml-2 flex items-center">
                <span className="text-yellow-400">⭐</span>
                <span className="ml-1">{court.rating} ({court.total_ratings} reviews)</span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {court.amenities.map((amenity, index) => (
                <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Operating Hours</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {Object.entries(court.operating_hours).map(([day, hours]) => (
                <div key={day} className="flex justify-between">
                  <span className="capitalize font-medium text-gray-700">{day}:</span>
                  <span className="text-gray-600">{hours}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md font-medium transition-colors">
              {court.booking_required ? 'Book Court' : 'Check In'}
            </button>
            <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors">
              Create Challenge
            </button>
          </div>
          
          {court.contact_info && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Contact: {court.contact_info}
            </div>
          )}
        </div>
      </div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Basketball Courts</h1>
          <p className="text-gray-600">Find the perfect court for your next game</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courts.map((court) => (
            <CourtCard key={court.id} court={court} />
          ))}
        </div>

        {courts.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl">🏀</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No courts found</h3>
            <p className="mt-2 text-gray-500">Check back later for new courts.</p>
          </div>
        )}

        {selectedCourt && (
          <CourtModal 
            court={selectedCourt} 
            onClose={() => setSelectedCourt(null)} 
          />
        )}
      </div>
    </Layout>
  );
};

export default Courts;