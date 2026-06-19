import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';

import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import DropFolder from './components/DropFolder';
import SharedFile from './components/SharedFile';

const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" />} />
          <Route path="/drop/:token" element={<DropFolder />} />
          <Route path="/shared/:token" element={<SharedFile />} />
          <Route 
            path="/dashboard" 
            element={<Navigate to="/dashboard/overview" replace />} 
          />
          <Route 
            path="/dashboard/overview" 
            element={
              <PrivateRoute>
                <Dashboard defaultView="overview" />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/my-files" 
            element={
              <PrivateRoute>
                <Dashboard defaultView="private" />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/department-files" 
            element={
              <PrivateRoute>
                <Dashboard defaultView="department" />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/student-portfolio" 
            element={
              <PrivateRoute>
                <Dashboard defaultView="students" />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/recent" 
            element={
              <PrivateRoute>
                <Dashboard defaultView="recent" />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/dashboard/shared" 
            element={
              <PrivateRoute>
                <Dashboard defaultView="shared" />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
