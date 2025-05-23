import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { setupDatabase } from './utils/setupDatabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CampusMap from './pages/CampusMap';
import Issues from './pages/Issues';
import LostFound from './pages/LostFound';
import Events from './pages/Events';
import Teaching from './pages/Teaching';
import CafeteriaMenu from './pages/CafeteriaMenu';
import Timetable from './pages/Timetable';
import Attendance from './pages/Attendance';
import Students from './pages/Students';
import Teachers from './pages/Teachers';
import Library from './pages/Library';
import StudyMaterial from './pages/StudyMaterial';
import Assignments from './pages/Assignments';
import Layout from './components/Layout';

function App() {
  const { user, loading } = useAuthStore();
  const isDark = useThemeStore((state) => state.isDark);

  useEffect(() => {
    // Run database setup when the app starts
    setupDatabase().then((success) => {
      if (success) {
        console.log('Database is ready');
      } else {
        console.error('Failed to set up database');
      }
    });
  }, []);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <Router>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route
            path="/"
            element={
              user ? (
                <Layout>
                  <Dashboard />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/map"
            element={
              user ? (
                <Layout>
                  <CampusMap />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/issues"
            element={
              user ? (
                <Layout>
                  <Issues />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/lost-found"
            element={
              user ? (
                <Layout>
                  <LostFound />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/events"
            element={
              user ? (
                <Layout>
                  <Events />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/teaching"
            element={
              user ? (
                <Layout>
                  <Teaching />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/cafeteria"
            element={
              user ? (
                <Layout>
                  <CafeteriaMenu />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/timetable"
            element={
              user ? (
                <Layout>
                  <Timetable />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/attendance"
            element={
              user?.role === 'student' ? (
                <Layout>
                  <Attendance />
                </Layout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/students"
            element={
              user?.role === 'admin' ? (
                <Layout>
                  <Students />
                </Layout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/teachers"
            element={
              user?.role === 'admin' ? (
                <Layout>
                  <Teachers />
                </Layout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/library"
            element={
              user ? (
                <Layout>
                  <Library />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/study-material"
            element={
              user ? (
                <Layout>
                  <StudyMaterial />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/assignments"
            element={
              user ? (
                <Layout>
                  <Assignments />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;