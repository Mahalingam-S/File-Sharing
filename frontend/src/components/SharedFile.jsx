import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Download, FileText, CheckCircle, ShieldCheck, User, Calendar, HardDrive } from 'lucide-react';

const SharedFile = () => {
  const { token } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFileInfo = async () => {
      try {
        const res = await axios.get(`/api/files/shared/info/${token}`);
        setFile(res.data);
      } catch (err) {
        setError('Invalid or expired share link.');
      } finally {
        setLoading(false);
      }
    };
    fetchFileInfo();
  }, [token]);

  const handleDownload = async () => {
    try {
      const res = await axios.get(`/api/files/shared/${token}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Download failed. The file might have been removed.');
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Verifying secure link...</p>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '400px' }}>
        <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel" 
        style={{ padding: '3rem', width: '100%', maxWidth: '500px', textAlign: 'center' }}
      >
        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '2.5rem', borderRadius: '30px', display: 'inline-block', marginBottom: '2rem' }}>
           <FileText size={64} color="var(--accent-primary)" />
        </div>

        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{file.originalName}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Ready for secure download</p>

        {file.isVerified && (
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem', textAlign: 'left' }}>
            <ShieldCheck size={24} color="var(--accent-primary)" />
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: '700' }}>Official Verified Campus Document</p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(59, 130, 246, 0.8)' }}>Certified by Institution Admin</p>
            </div>
          </div>
        )}

        <div className="info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem', textAlign: 'left' }}>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Uploaded By</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} color="var(--accent-primary)" />
              <p style={{ fontSize: '0.85rem', fontWeight: '500' }}>{file.ownerName}</p>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>File Size</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive size={14} color="var(--success)" />
              <p style={{ fontSize: '0.85rem', fontWeight: '500' }}>{(file.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleDownload}
          className="btn-primary" 
          style={{ width: '100%', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '1rem' }}
        >
          <Download size={20} /> Download Document
        </button>
        
        <p style={{ marginTop: '2rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          Secure Campus Link | Powered by Campus Drive
        </p>
      </motion.div>
    </div>
  );
};

export default SharedFile;
