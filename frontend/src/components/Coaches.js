import React, { useState, useEffect } from 'react';
import { coachesAPI, usersAPI } from '../services/api';
import Layout from './Layout';

const Coaches = () => {
  const [coaches, setCoaches] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCoach, setSelectedCoach] = useState(null);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        const coachesRes = await coachesAPI.getCoaches();
        setCoaches(coachesRes.data);
        
        // Fetch user details for each coach
        const userPromises = coachesRes.data.map(coach => 
          usersAPI.getUser(coach.user_id).catch(() => null)
        );
        
        const userResponses = await Promise.all(userPromises);
        const usersMap = {};
        
        userResponses.forEach((userRes, index) => {
          if (userRes?.data) {
            usersMap[coachesRes.data[index].user_id] = userRes.data;
          }
        });
        
        setUsers(usersMap);
      } catch (error) {
        console.error('Error fetching coaches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, []);

  const CoachCard = ({ coach }) => {
    const user = users[coach.user_id];
    if (!user) return null;

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <img
              className="h-16 w-16 rounded-full object-cover"
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}&background=FF6B35&color=fff`}
              alt={user.full_name}
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">{user.full_name}</h3>
              <p className="text-sm text-gray-600">{coach.experience_years} years experience</p>
              <div className="flex items-center mt-1">
                <span className="text-yellow-400">⭐</span>
                <span className="ml-1 text-sm text-gray-600">{coach.rating}</span>
                <span className="ml-1 text-sm text-gray-500">({coach.total_ratings} reviews)</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-orange-600">${coach.hourly_rate}</span>
              <span className="text-gray-500 text-sm">/hour</span>
            </div>
          </div>
          
          <p className="text-gray-700 text-sm mb-4 line-clamp-3">{coach.bio}</p>
          
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {coach.specialties.slice(0, 4).map((specialty, index) => (
                <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  {specialty}
                </span>
              ))}
              {coach.specialties.length > 4 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{coach.specialties.length - 4} more
                </span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Total Sessions:</span>
              <span className="ml-2 text-gray-600">{coach.total_sessions}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Skill Level:</span>
              <span className="ml-2 text-gray-600 capitalize">{user.skill_level}</span>
            </div>
          </div>
          
          {coach.certifications.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Certifications</h4>
              <div className="flex flex-wrap gap-2">
                {coach.certifications.map((cert, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={() => setSelectedCoach({...coach, user})}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md font-medium transition-colors"
            >
              View Profile
            </button>
            <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors">
              Book Session
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CoachModal = ({ coach, onClose }) => {
    const availabilityDays = Object.keys(coach.availability);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
          <div className="relative p-6 border-b border-gray-200">
            <div className="flex items-center space-x-6">
              <img
                className="h-24 w-24 rounded-full object-cover"
                src={coach.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(coach.user.full_name)}&background=FF6B35&color=fff`}
                alt={coach.user.full_name}
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{coach.user.full_name}</h2>
                <p className="text-gray-600">Professional Basketball Coach</p>
                <div className="flex items-center mt-2">
                  <span className="text-yellow-400 text-lg">⭐</span>
                  <span className="ml-1 text-lg font-medium">{coach.rating}</span>
                  <span className="ml-1 text-gray-500">({coach.total_ratings} reviews)</span>
                  <span className="mx-3 text-gray-300">•</span>
                  <span className="text-gray-600">{coach.experience_years} years experience</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-orange-600">${coach.hourly_rate}</span>
                <span className="text-gray-500">/hour</span>
                <div className="text-sm text-gray-500 mt-1">{coach.total_sessions} sessions completed</div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
              <p className="text-gray-700">{coach.bio}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {coach.specialties.map((specialty, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
              
              {coach.certifications.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Certifications</h3>
                  <div className="space-y-2">
                    {coach.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Availability</h3>
              {availabilityDays.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availabilityDays.map(day => (
                    <div key={day} className="border border-gray-200 rounded-lg p-3">
                      <div className="font-medium text-gray-900 capitalize mb-2">{day}</div>
                      <div className="flex flex-wrap gap-2">
                        {coach.availability[day].map((time, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {time}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No availability information provided</p>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">Experience</div>
                  <div className="text-gray-600">{coach.experience_years} years</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">Total Sessions</div>
                  <div className="text-gray-600">{coach.total_sessions}</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">Rating</div>
                  <div className="text-gray-600">{coach.rating}/5.0</div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-6 rounded-md font-medium transition-colors">
                Book Training Session
              </button>
              <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-md font-medium transition-colors">
                Send Message
              </button>
              <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                Add to Favorites
              </button>
            </div>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Basketball Coaches</h1>
          <p className="text-gray-600">Find professional coaches to elevate your game</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coaches.map((coach) => (
            <CoachCard key={coach.id} coach={coach} />
          ))}
        </div>

        {coaches.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl">👨‍🏫</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No coaches found</h3>
            <p className="mt-2 text-gray-500">Check back later for available coaches.</p>
          </div>
        )}

        {selectedCoach && (
          <CoachModal 
            coach={selectedCoach} 
            onClose={() => setSelectedCoach(null)} 
          />
        )}
      </div>
    </Layout>
  );
};

export default Coaches;