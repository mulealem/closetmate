import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useDarkMode } from './hooks/useDarkMode';
import Layout from './components/Layout';
import AuthForm from './components/AuthForm';
import Dashboard from './pages/Dashboard';
import Wardrobe from './pages/Wardrobe';
import Favorites from './pages/Favorites';
import Preferences from './pages/Preferences';

function App() {
  const { user, loading } = useAuth();
  const { isDarkMode } = useDarkMode();

  // Initialize dark mode on app load
  useEffect(() => {
    // The useDarkMode hook handles the initialization
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 dark:border-purple-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading ClosetMate...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/preferences" element={<Preferences />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;