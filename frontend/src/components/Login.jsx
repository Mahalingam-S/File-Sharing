import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [requireProfile, setRequireProfile] = useState(false);
  const [googleCred, setGoogleCred] = useState(null);

  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('General');
  const [providedName, setProvidedName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [departments, setDepartments] = useState([
    { _id: '1', code: 'CSE', name: 'CSE Department' },
    { _id: '2', code: 'MCA', name: 'MCA Department' },
    { _id: '3', code: 'ECE', name: 'ECE Department' },
    { _id: '4', code: 'Placement Cell', name: 'Placement Cell' },
    { _id: '5', code: 'Examination Cell', name: 'Examination Cell' },
    { _id: '6', code: 'General', name: 'General' }
  ]);

  // Admin login states
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const { googleAuth, login, api } = useContext(AuthContext);

  useEffect(() => {
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      setError('Google Sign-In configuration is missing. If you are the administrator, please ensure VITE_GOOGLE_CLIENT_ID is set in your environment.');
    }
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data && Array.isArray(res.data)) {
          setDepartments(res.data);
        }
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, [api]);
  const navigate = useNavigate();

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(adminEmail, adminPassword);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Admin login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setIsLoading(true);
    try {
      const res = await googleAuth(credentialResponse.credential);
      if (res?.requireProfile) {
        setGoogleCred(credentialResponse.credential);
        setProvidedName(res.name || '');
        setRequireProfile(true);
      } else if (res?.success) {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await googleAuth(googleCred, role, department, providedName, role === 'student' ? rollNo : null);
      if (res?.success) {
        navigate('/dashboard');
      } else {
        setError(res?.message || 'Failed to complete profile.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Campus Drive</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {requireProfile ? 'Complete your profile' : 'Sign in to access your files'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--danger)',
              color: '#fca5a5',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.875rem' }}>{error}</span>
          </motion.div>
        )}

        {!requireProfile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            {!showAdminLogin ? (
              <>
                {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                      setError('Google Sign-In failed. Please try again.');
                    }}
                    useOneTap
                    shape="pill"
                    theme="filled_black"
                    text="continue_with"
                    size="large"
                  />
                ) : (
                  <div style={{
                    color: 'var(--danger)',
                    fontSize: '0.875rem',
                    textAlign: 'center',
                    padding: '1rem',
                    border: '1px dashed var(--danger)',
                    borderRadius: '0.5rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    width: '100%'
                  }}>
                    Google Sign-In is unavailable.
                  </div>
                )}
                {isLoading && <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Authenticating...</p>}

                <button
                  onClick={() => setShowAdminLogin(true)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Admin Login
                </button>
              </>
            ) : (
              <form onSubmit={handleAdminSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', textAlign: 'center' }}>Admin Access</h3>
                <div>
                  <input
                    type="text"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="Admin Email"
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Password"
                    required
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                  style={{ marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1 }}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem', cursor: 'pointer' }}
                >
                  Back to Google Login
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
              <input
                type="text"
                value={providedName}
                onChange={(e) => setProvidedName(e.target.value)}
                placeholder="Enter your full name"
                required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', appearance: 'none' }}
              >
                <option value="student" style={{ color: 'black' }}>Student</option>
                <option value="faculty" style={{ color: 'black' }}>Faculty</option>
                <option value="staff" style={{ color: 'black' }}>Staff</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)', appearance: 'none' }}
              >
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.code} style={{ color: 'black' }}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {role === 'student' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Roll Number</label>
                <input
                  type="text"
                  value={rollNo}
                  onChange={(e) => setRollNo(e.target.value)}
                  placeholder="Enter your roll number"
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? 'Saving...' : 'Complete Profile'}
            </button>
            <button
              type="button"
              onClick={() => {
                setRequireProfile(false);
                setGoogleCred(null);
              }}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.5rem', cursor: 'pointer', display: 'block', margin: '0.5rem auto 0' }}
            >
              Back to Sign In
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
