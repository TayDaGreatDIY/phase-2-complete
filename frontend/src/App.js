import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Dashboard from './components/Dashboard';
import Courts from './components/Courts';
import Challenges from './components/Challenges';
import Store from './components/Store';
import Coaches from './components/Coaches';
import RFIDCheckin from './components/RFIDCheckin';
import Tournaments from './components/Tournaments';
import LiveScoring from './components/LiveScoring';
import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading M2DG Basketball...</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Auth Page Component
const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  return isLogin ? 
    <LoginForm onToggleForm={() => setIsLogin(false)} /> : 
    <RegisterForm onToggleForm={() => setIsLogin(true)} />;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            
            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/courts" 
              element={
                <ProtectedRoute>
                  <Courts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/challenges" 
              element={
                <ProtectedRoute>
                  <Challenges />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/store" 
              element={
                <ProtectedRoute>
                  <Store />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/coaches" 
              element={
                <ProtectedRoute>
                  <Coaches />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rfid" 
              element={
                <ProtectedRoute>
                  <RFIDCheckin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tournaments" 
              element={
                <ProtectedRoute>
                  <Tournaments />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live-scoring" 
              element={
                <ProtectedRoute>
                  <LiveScoring />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;