import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, User, Shield, AlertCircle } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: 'General',
    rollNo: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([
    { _id: '1', code: 'CSE', name: 'CSE Department' },
    { _id: '2', code: 'MCA', name: 'MCA Department' },
    { _id: '3', code: 'ECE', name: 'ECE Department' },
    { _id: '4', code: 'Placement Cell', name: 'Placement Cell' },
    { _id: '5', code: 'Examination Cell', name: 'Examination Cell' },
    { _id: '6', code: 'General', name: 'General' }
  ]);
  const { register, api } = useContext(AuthContext);

  useEffect(() => {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await register(formData.name, formData.email, formData.password, formData.role, formData.department, formData.role === 'student' ? formData.rollNo : null);
      navigate('/dashboard');
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
        style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', marginBottom: '0.5rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Join the Secure Campus Drive</p>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <User size={18} />
              </div>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe" 
                required 
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <Mail size={18} />
              </div>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="student@gmail.com" 
                required 
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••" 
                required 
                minLength="6"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Role</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <Shield size={18} />
              </div>
              <select 
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{ paddingLeft: '2.75rem', appearance: 'none' }}
              >
                <option value="student" style={{ color: 'black' }}>Student</option>
                <option value="faculty" style={{ color: 'black' }}>Faculty</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Department Workspace</label>
            <div style={{ position: 'relative' }}>
              <select 
                name="department"
                value={formData.department}
                onChange={handleChange}
                style={{ paddingLeft: '1rem', appearance: 'none' }}
              >
                {departments.map((dept) => (
                  <option key={dept._id} value={dept.code} style={{ color: 'black' }}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formData.role === 'student' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Roll Number</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  name="rollNo"
                  value={formData.rollNo}
                  onChange={handleChange}
                  placeholder="Enter Roll Number" 
                  required 
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={isLoading}
            style={{ marginTop: '0.5rem', opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
