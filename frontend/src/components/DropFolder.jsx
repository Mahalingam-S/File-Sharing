import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const DropFolder = () => {
  const { token } = useParams();
  const [folderInfo, setFolderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchFolderInfo = async () => {
      try {
        const res = await axios.get(`/api/folders/drop/${token}`);
        setFolderInfo(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired upload link.');
      } finally {
        setLoading(false);
      }
    };
    fetchFolderInfo();
  }, [token]);

  const handleDropUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Get the JWT token if they are logged in, so their name is attached
    const jwt = localStorage.getItem('token');
    if (!jwt) {
      alert("You must be logged in to submit an assignment!");
      window.location.href = '/login';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('shareToken', token); // Tell the API this is a drop folder

    try {
      await axios.post('/api/files', formData, {
        headers: { 
          'Authorization': `Bearer ${jwt}`
        }
      });
      setSuccess(true);
    } catch (err) {
      alert(err.response?.data?.message || 'File upload failed');
    } finally {
      e.target.value = ''; // Reset input to allow uploading the same file again
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Drop Folder...</div>;

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
        <h2>{error}</h2>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Assignment Drop Portal</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Uploading to <strong>{folderInfo.name}</strong><br/>
          Requested by <strong>{folderInfo.ownerName}</strong>
        </p>

        {success ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ color: 'var(--success)' }}>
            <CheckCircle size={64} style={{ margin: '0 auto 1rem' }} />
            <h2>Upload Successful!</h2>
            <p style={{ marginTop: '10px' }}>Your file has been securely submitted.</p>
          </motion.div>
        ) : (
          <>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleDropUpload}
            />
            <button 
              onClick={() => fileInputRef.current.click()} 
              className="btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <Upload size={24} /> Select File to Submit
            </button>
            <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Note: You must be logged into your Campus Account to verify your identity before uploading.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default DropFolder;
