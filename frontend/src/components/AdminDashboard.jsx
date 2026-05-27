import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Shield, Activity, Users, HardDrive, ArrowLeft, FileText, X, Download, 
  Trash2, CheckCircle, AlertCircle, Info, Mail, Clock, Calendar, Check,
  UserCheck, Search, Bell, ChevronDown, MoreHorizontal, Layout, Settings, FileSpreadsheet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const { user, api, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalFiles: 0, totalStorageBytes: '0 MB' });
  const [logs, setLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [helpRequests, setHelpRequests] = useState([]);
  const [selectedUserFiles, setSelectedUserFiles] = useState(null);
  const [viewingUserName, setViewingUserName] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' });
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'users', 'files', 'logs', 'settings'
  const [searchVal, setSearchVal] = useState('');

  const showToast = (message, type = 'info') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 4000);
  };

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, logsRes, usersRes, helpRes] = await Promise.all([
          api.get('/admin/stats'),
          api.get('/admin/logs'),
          api.get('/admin/users'),
          api.get('/help/admin/requests')
        ]);
        setStats(statsRes?.data || { totalUsers: 0, totalFiles: 0, totalStorageBytes: '0 MB' });
        setLogs(logsRes?.data || []);
        setUsersList(usersRes?.data || []);
        setHelpRequests(helpRes?.data || []);
      } catch (error) {
        console.error('Error fetching admin data', error);
        setErrorMsg(error.message || 'Failed to load dashboard data');
      }
    };
    fetchAdminData();
  }, []);

  const handleViewUserFiles = async (userId, userName) => {
    try {
      const res = await api.get(`/admin/users/${userId}/files`);
      setSelectedUserFiles(res.data);
      setViewingUserName(userName);
    } catch (error) {
      alert('Failed to fetch user files');
    }
  };

  const closeFileModal = () => {
    setSelectedUserFiles(null);
    setViewingUserName('');
  };

  const handleClearLogs = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear Audit Logs',
      message: 'Are you sure you want to clear ALL audit logs? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete('/admin/logs');
          setLogs([]);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          alert('Failed to clear logs');
        }
      }
    });
  };

  const handleDeleteLog = (logId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Log Entry',
      message: 'Are you sure you want to delete this specific log entry?',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/logs/${logId}`);
          setLogs(logs.filter(l => l._id !== logId));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          alert('Failed to delete log');
        }
      }
    });
  };

  const handleDeleteUserFile = (fileId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User File',
      message: 'Are you sure you want to permanently delete this file from the server?',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/files/${fileId}`);
          setSelectedUserFiles(selectedUserFiles.filter(f => f._id !== fileId));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to delete file', 'danger');
        }
      }
    });
  };

  const handleDeleteUser = (userId) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User & All Data',
      message: 'WARNING: This will permanently delete this user, all their folders, and all their files. This action CANNOT be undone. Proceed?',
      onConfirm: async () => {
        try {
          await api.delete(`/admin/users/${userId}`);
          setUsersList(usersList.filter(u => u._id !== userId));
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          showToast('User removed successfully', 'success');
          
          // Refresh stats
          const statsRes = await api.get('/admin/stats');
          setStats(statsRes.data);
        } catch (error) {
          showToast(error.response?.data?.message || 'Failed to delete user', 'danger');
        }
      }
    });
  };

  const handleApproveUser = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/approve`);
      setUsersList(usersList.map(u => u._id === userId ? { ...u, isApproved: true } : u));
      showToast('User approved successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to approve user', 'danger');
    }
  };

  const handleDownloadUserFile = async (id, originalName) => {
    try {
      const res = await api.get(`/files/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      showToast('Download started', 'success');
    } catch (err) {
      console.error('Download failed', err);
      showToast('Download failed', 'danger');
    }
  };

  const handleVerifyFile = async (fileId) => {
    try {
      const res = await api.patch(`/admin/files/${fileId}/verify`);
      setSelectedUserFiles(selectedUserFiles.map(f => f._id === fileId ? res.data.file : f));
      showToast('File verified successfully', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to verify file', 'danger');
    }
  };

  const handleUpdateHelpStatus = async (id, status) => {
    try {
      await api.patch(`/help/admin/requests/${id}`, { status });
      setHelpRequests(helpRequests.map(req => req._id === id ? { ...req, status } : req));
      showToast(`Request marked as ${status}`, 'success');
    } catch (error) {
      showToast('Failed to update status', 'danger');
    }
  };

  const handleDeleteHelpRequest = async (id) => {
    try {
      await api.delete(`/help/admin/requests/${id}`);
      setHelpRequests(helpRequests.filter(req => req._id !== id));
      showToast('Request deleted', 'info');
    } catch (error) {
      showToast('Failed to delete request', 'danger');
    }
  };

  // Severity calculator based on logs
  const getSeverityDistribution = () => {
    let low = 0;
    let medium = 0;
    let high = 0;
    
    logs.forEach(log => {
      const act = log.action?.toLowerCase() || '';
      if (act.includes('delete') || act.includes('remove') || act.includes('revoke')) {
        high++;
      } else if (act.includes('upload') || act.includes('create') || act.includes('share')) {
        medium++;
      } else {
        low++;
      }
    });

    const total = low + medium + high;
    if (total === 0) {
      return { lowPercent: 74, mediumPercent: 18, highPercent: 8, lowCount: 0, mediumCount: 0, highCount: 0 };
    }

    return {
      lowPercent: Math.round((low / total) * 100),
      mediumPercent: Math.round((medium / total) * 100),
      highPercent: Math.round((high / total) * 100),
      lowCount: low,
      mediumCount: medium,
      highCount: high
    };
  };

  const severityData = getSeverityDistribution();

  // SVG Circular chart parameters
  const cCirc = 157.08; // 2 * PI * r (r=25)
  const lowDash = (severityData.lowPercent / 100) * cCirc;
  const medDash = (severityData.mediumPercent / 100) * cCirc;
  const highDash = (severityData.highPercent / 100) * cCirc;

  const getLogSeverity = (action) => {
    const act = action?.toLowerCase() || '';
    if (act.includes('delete') || act.includes('remove') || act.includes('revoke')) return { label: 'High', color: '#f87171', bg: 'rgba(248,113,113,0.1)' };
    if (act.includes('upload') || act.includes('create') || act.includes('share')) return { label: 'Medium', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' };
    return { label: 'Low', color: '#34d399', bg: 'rgba(52,211,153,0.1)' };
  };

  const getLogActionColor = (action) => {
    const act = action?.toLowerCase() || '';
    if (act.includes('login')) return '#22d3ee'; // Light blue
    if (act.includes('upload')) return '#34d399'; // Green
    if (act.includes('delete')) return '#ef4444'; // Red
    return '#a855f7'; // Purple
  };

  const filteredUsers = usersList.filter(u => {
    if (!u) return false;
    const term = searchVal.toLowerCase();
    return u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term) || u.role?.toLowerCase().includes(term) || u.department?.toLowerCase().includes(term);
  });

  const filteredLogs = logs.filter(l => {
    if (!l) return false;
    const term = searchVal.toLowerCase();
    return l.userId?.email?.toLowerCase().includes(term) || l.action?.toLowerCase().includes(term) || l.entityType?.toLowerCase().includes(term);
  });

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', overflow: 'hidden' }}>
      
      {/* Sidebar Navigation */}
      <aside className="glass-panel sidebar" style={{ 
        width: '260px', 
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        margin: '1.25rem 0 1.25rem 1.25rem',
        height: 'calc(100vh - 2.5rem)',
        padding: '1.5rem 1rem',
        borderRadius: '24px',
        background: 'rgba(15, 23, 42, 0.4)'
      }}>
        {/* Brand Logo Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem', padding: '0 8px' }}>
          <div className="logo-s-badge" style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)', filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.35))' }}>S</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="brand-title" style={{ letterSpacing: '0.05em', fontWeight: '800' }}>SECURESHARE</span>
            <span className="brand-subtitle" style={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em' }}>Admin Dashboard</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Layout size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Dashboard</span>
          </div>
          <div className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Users Directory</span>
          </div>
          <div className={`sidebar-item ${activeTab === 'files' ? 'active' : ''}`} onClick={() => setActiveTab('files')}>
            <FileText size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Files Vault</span>
          </div>
          <div className={`sidebar-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
            <Clock size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Security Logs</span>
          </div>
          <div className={`sidebar-item ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>
            <Mail size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Support Center</span>
          </div>
        </nav>

        {/* Bottom Exit Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem', marginTop: 'auto' }}>
          <div className="sidebar-item" onClick={() => navigate('/dashboard')} style={{ color: '#22d3ee' }}>
            <ArrowLeft size={18} />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Back to Drive</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <main style={{ 
        flexGrow: 1, 
        padding: '1.25rem 2rem 1.25rem 2rem', 
        height: '100vh', 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>
        
        {/* Top Header Row (Search & Action Buttons) */}
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', width: '100%', gap: '1.25rem' }}>
          
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
            {activeTab === 'dashboard' ? 'Platform Overview' : (activeTab === 'users' ? 'Users Management' : (activeTab === 'files' ? 'Files Directory' : (activeTab === 'logs' ? 'Security Audit Logs' : 'Support Tickets')))}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* Magnifying glass smart search */}
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.5rem 1.25rem', width: '280px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Search size={16} color="var(--text-secondary)" />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', fontSize: '0.85rem', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            {/* Bell Notifications */}
            <button className="glass-panel" style={{ padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
              <Bell size={18} />
              <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: '#ec4899', borderRadius: '50%', boxShadow: '0 0 8px #ec4899' }}></span>
            </button>

            {/* Admin Profile capsule */}
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.8rem' }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.name || 'Dr. Elara Vance'}</span>
              <ChevronDown size={14} color="var(--text-secondary)" />
            </div>
          </div>
        </header>

        {errorMsg && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: '0.85rem' }}>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: Dashboard Overview */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Platform Overview Cards (4 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              
              {/* Card 1: Users */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', height: '140px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
                  <span>Users</span>
                  <MoreHorizontal size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.totalUsers}</span>
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700' }}>+5.1%</span>
                </div>
                {/* SVG sparkline */}
                <svg viewBox="0 0 100 30" width="100%" height="45px" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                  <path d="M 0 25 C 15 15, 30 29, 45 14 C 60 4, 75 22, 100 6" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Card 2: Active Files */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', height: '140px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
                  <span>Active Files</span>
                  <MoreHorizontal size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.totalFiles}</span>
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '700' }}>+8.3%</span>
                </div>
                {/* SVG sparkline */}
                <svg viewBox="0 0 100 30" width="100%" height="45px" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                  <path d="M 0 28 C 18 10, 35 25, 55 12 C 75 0, 85 20, 100 8" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Card 3: Total Storage */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', height: '140px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
                  <span>Total Storage</span>
                  <MoreHorizontal size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
                  <span style={{ fontSize: '2.0rem', fontWeight: '800', color: 'var(--text-primary)' }}>{stats.totalStorageBytes}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>74% used</span>
                </div>
                {/* SVG sparkline */}
                <svg viewBox="0 0 100 30" width="100%" height="45px" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                  <path d="M 0 25 C 20 28, 40 10, 60 14 C 80 18, 90 5, 100 8" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Card 4: Security Events */}
              <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', height: '140px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
                  <span>Security Events</span>
                  <MoreHorizontal size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>{logs.length}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>today</span>
                </div>
                {/* SVG sparkline */}
                <svg viewBox="0 0 100 30" width="100%" height="45px" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                  <path d="M 0 20 L 15 10 L 30 25 L 45 5 L 60 22 L 75 12 L 90 28 L 100 8" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Middle Deck: Approvals & Audit logs (Two Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', minHeight: '340px' }}>
              
              {/* Left Column: User Approval Controls */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Approval Controls</h3>
                  <MoreHorizontal size={16} color="var(--text-secondary)" />
                </div>
                
                <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '260px' }}>
                  {usersList.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No users directories found.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      
                      {/* Grid Headers */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 0.8fr 0.6fr 1fr', padding: '6px 10px', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <div>User</div>
                        <div>Dept</div>
                        <div>Status</div>
                        <div>Req</div>
                        <div style={{ textAlign: 'right' }}>Actions</div>
                      </div>

                      {/* User Rows */}
                      {usersList.map(u => (
                        <div 
                          key={u._id} 
                          className="explorer-row" 
                          style={{ gridTemplateColumns: '1.5fr 1fr 0.8fr 0.6fr 1fr', padding: '10px', cursor: 'default', borderRadius: '10px' }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.75rem', flexShrink: 0 }}>
                              {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                              <span style={{ fontWeight: '600', fontSize: '0.8rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                            {u.department}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ 
                              fontSize: '0.65rem', 
                              fontWeight: '700', 
                              color: u.isApproved ? '#34d399' : '#fbbf24', 
                              border: `1px solid ${u.isApproved ? 'rgba(52, 211, 153, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
                              background: u.isApproved ? 'rgba(52, 211, 153, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                              padding: '2px 6px', 
                              borderRadius: '6px' 
                            }}>
                              {u.isApproved ? 'Approved' : 'Pending'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                            0
                          </div>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {!u.isApproved ? (
                              <button 
                                onClick={() => handleApproveUser(u._id)}
                                className="row-action-btn"
                                style={{ padding: '4px 8px', fontSize: '0.65rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.35)', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                              >
                                Approve
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', paddingRight: '8px' }}><Check size={12} color="#34d399" /></span>
                            )}
                            <button 
                              onClick={() => handleDeleteUser(u._id)}
                              className="row-action-btn"
                              style={{ padding: '4px 8px', fontSize: '0.65rem', color: '#f87171', background: 'rgba(248, 113, 113, 0.12)', borderColor: 'rgba(248, 113, 113, 0.35)', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
                            >
                              Deny
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Security Audit Logs */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Audit Logs</h3>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Immutable system transactions</span>
                  </div>
                  <MoreHorizontal size={16} color="var(--text-secondary)" />
                </div>

                <div style={{ flexGrow: 1, overflowY: 'auto', maxHeight: '260px' }}>
                  {logs.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No logs registered yet.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      
                      {/* Grid Headers */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 1fr', padding: '6px 10px', fontSize: '0.7rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <div>Timestamp</div>
                        <div>Action Type</div>
                        <div>User</div>
                        <div style={{ textAlign: 'right' }}>Severity</div>
                      </div>

                      {/* Log Rows */}
                      {logs.slice(0, 10).map(log => {
                        const sev = getLogSeverity(log.action);
                        return (
                          <div 
                            key={log._id} 
                            className="explorer-row" 
                            style={{ gridTemplateColumns: '1.2fr 1fr 0.8fr 1fr', padding: '10px', cursor: 'default', borderRadius: '10px' }}
                          >
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                              {log.createdAt ? new Date(log.createdAt).toLocaleDateString() + ' ' + new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: getLogActionColor(log.action) }}>
                                {log.action || 'Unknown'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {log.userId?.email?.split('@')[0] || 'System'}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <span style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: '700', 
                                color: sev.color, 
                                border: `1px solid ${sev.color}35`, 
                                background: sev.bg, 
                                padding: '2px 8px', 
                                borderRadius: '6px' 
                              }}>
                                {sev.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Analytics Deck: Activity volumes & Severity Distributions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.5rem' }}>
              
              {/* Left Column: Activity Volumes */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity Volumes</h3>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '2px' }}></span> Uploads
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '8px', height: '8px', background: '#22d3ee', borderRadius: '2px' }}></span> Downloads
                    </div>
                  </div>
                </div>
                
                {/* CSS/SVG Bar Chart */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '140px', padding: '0 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                  {/* Grid Lines */}
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: '25%', borderBottom: '1px dashed rgba(255,255,255,0.03)' }}></div>
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: '50%', borderBottom: '1px dashed rgba(255,255,255,0.03)' }}></div>
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: '75%', borderBottom: '1px dashed rgba(255,255,255,0.03)' }}></div>

                  {/* Monthly bars */}
                  {[
                    { m: 'Jan', up: 60, dn: 20 },
                    { m: 'Feb', up: 100, dn: 40 },
                    { m: 'Mar', up: 140, dn: 65 },
                    { m: 'Apr', up: 180, dn: 95 },
                    { m: 'May', up: 120, dn: 55 },
                    { m: 'Jun', up: 150, dn: 75 },
                    { m: 'Jul', up: 210, dn: 110 },
                    { m: 'Aug', up: 170, dn: 85 }
                  ].map((bar, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 1, width: '40px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '110px' }}>
                        {/* Upload bar (Blue) */}
                        <div style={{ width: '8px', height: `${(bar.up / 250) * 100}%`, background: 'linear-gradient(to top, #1d4ed8, #3b82f6)', borderRadius: '4px 4px 0 0', filter: 'drop-shadow(0 2px 4px rgba(59,130,246,0.3))' }}></div>
                        {/* Download bar (Cyan) */}
                        <div style={{ width: '8px', height: `${(bar.dn / 250) * 100}%`, background: 'linear-gradient(to top, #0891b2, #22d3ee)', borderRadius: '4px 4px 0 0', filter: 'drop-shadow(0 2px 4px rgba(34,211,238,0.3))' }}></div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{bar.m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Event Severity Distributions */}
              <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Event Severity Distributions</h3>
                  <MoreHorizontal size={16} color="var(--text-secondary)" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexGrow: 1 }}>
                  {/* SVG Donut Chart */}
                  <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                    <svg viewBox="0 0 70 70" width="100%" height="100%">
                      <circle cx="35" cy="35" r="25" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                      
                      {/* Segment 1: Low (Cyan) */}
                      <circle 
                        cx="35" 
                        cy="35" 
                        r="25" 
                        fill="none" 
                        stroke="#22d3ee" 
                        strokeWidth="8" 
                        strokeDasharray={`${lowDash} ${cCirc}`}
                        strokeDashoffset="0"
                        transform="rotate(-90 35 35)"
                        style={{ filter: 'drop-shadow(0 0 3px rgba(34, 211, 238, 0.4))' }}
                      />
                      
                      {/* Segment 2: Medium (Purple) */}
                      <circle 
                        cx="35" 
                        cy="35" 
                        r="25" 
                        fill="none" 
                        stroke="#a855f7" 
                        strokeWidth="8" 
                        strokeDasharray={`${medDash} ${cCirc}`}
                        strokeDashoffset="0"
                        transform={`rotate(${-90 + (severityData.lowPercent / 100) * 360} 35 35)`}
                        style={{ filter: 'drop-shadow(0 0 3px rgba(168, 85, 247, 0.4))' }}
                      />
                      
                      {/* Segment 3: High (Orange/Red) */}
                      <circle 
                        cx="35" 
                        cy="35" 
                        r="25" 
                        fill="none" 
                        stroke="#f97316" 
                        strokeWidth="8" 
                        strokeDasharray={`${highDash} ${cCirc}`}
                        strokeDashoffset="0"
                        transform={`rotate(${-90 + ((severityData.lowPercent + severityData.mediumPercent) / 100) * 360} 35 35)`}
                        style={{ filter: 'drop-shadow(0 0 3px rgba(249, 115, 22, 0.4))' }}
                      />
                    </svg>
                    {/* Centered overall indicator */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>TOTAL</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '-2px' }}>{logs.length}</span>
                    </div>
                  </div>

                  {/* Donut chart legends */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', flexGrow: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', background: '#22d3ee', borderRadius: '50%' }}></span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Low Severity</span>
                      </div>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{severityData.lowPercent}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', background: '#a855f7', borderRadius: '50%' }}></span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Medium Severity</span>
                      </div>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{severityData.mediumPercent}%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', background: '#f97316', borderRadius: '50%' }}></span>
                        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>High Severity</span>
                      </div>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{severityData.highPercent}%</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Users Management view */}
        {activeTab === 'users' && (
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>Registered Users Directory</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--glass-bg-hover)', padding: '4px 12px', borderRadius: '10px', fontWeight: '600' }}>
                {filteredUsers.length} Users Found
              </span>
            </div>

            <div style={{ overflowX: 'auto', background: 'rgba(255, 255, 255, 0.02)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.8fr 1fr 1fr 1.6fr', padding: '10px 1rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <div>User Name</div>
                  <div>Email Address</div>
                  <div>Role Status</div>
                  <div>Joined Date</div>
                  <div style={{ textAlign: 'right', paddingRight: '1rem' }}>Directory Operations</div>
                </div>

                {filteredUsers.map(u => (
                  <div 
                    key={u._id}
                    className="explorer-row"
                    style={{ gridTemplateColumns: '1.5fr 1.8fr 1fr 1fr 1.6fr', padding: '12px 1rem', cursor: 'default' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: getUserAvatarColor(u.role), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold', color: 'white', flexShrink: 0 }}>
                        {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</span>
                        {u.rollNo && <span style={{ fontSize: '0.7rem', color: '#22d3ee', fontWeight: '500' }}>{u.rollNo}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ 
                        background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.15)' : u.role === 'faculty' ? 'rgba(245, 158, 11, 0.15)' : u.role === 'staff' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)', 
                        color: u.role === 'admin' ? '#ef4444' : u.role === 'faculty' ? '#fbbf24' : u.role === 'staff' ? '#10b981' : '#3b82f6',
                        padding: '3px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', border: `1px solid ${u.role === 'admin' ? 'rgba(239,68,68,0.25)' : u.role === 'faculty' ? 'rgba(245,158,11,0.25)' : u.role === 'staff' ? 'rgba(16,185,129,0.25)' : 'rgba(59,130,246,0.25)'}`
                      }}>
                        {u.role}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleViewUserFiles(u._id, u.name)}
                        className="row-action-btn"
                        style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', color: '#22d3ee', background: 'rgba(34, 211, 238, 0.12)', borderColor: 'rgba(34, 211, 238, 0.35)', borderRadius: '8px', fontWeight: '500' }}
                      >
                        <FileText size={12} /> View Files
                      </button>
                      
                      {u.role !== 'admin' && (
                        <button 
                          onClick={() => handleDeleteUser(u._id)}
                          className="row-action-btn"
                          style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', color: '#f87171', background: 'rgba(248, 113, 113, 0.12)', borderColor: 'rgba(248, 113, 113, 0.35)', borderRadius: '8px', fontWeight: '500' }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                      
                      {!u.isApproved && (
                        <button 
                          onClick={() => handleApproveUser(u._id)}
                          className="row-action-btn"
                          style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.35)', borderRadius: '8px', fontWeight: '600' }}
                        >
                          <UserCheck size={12} /> Approve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Files Vault directory */}
        {activeTab === 'files' && (
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>Master User Directory</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Select a user from the directory below to view and audit their personal file vault.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {usersList.map(u => (
                <div 
                  key={u._id}
                  onClick={() => handleViewUserFiles(u._id, u.name)}
                  className="glass-panel"
                  style={{ padding: '1.25rem', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)', transition: 'transform 0.2s, background-color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: getUserAvatarColor(u.role), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                    <h4 style={{ margin: 0, fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</p>
                    <span style={{ display: 'inline-block', fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase', color: '#22d3ee', marginTop: '4px', letterSpacing: '0.05em' }}>{u.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Security logs history */}
        {activeTab === 'logs' && (
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>System Transaction History</h2>
              <button 
                onClick={handleClearLogs}
                className="row-action-btn" 
                style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.12)', borderColor: 'rgba(248, 113, 113, 0.35)', fontSize: '0.8rem', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                Clear Audit Trail
              </button>
            </div>

            <div style={{ overflowX: 'auto', background: 'rgba(255, 255, 255, 0.02)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Headers */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.2fr 1.4fr 1fr 1fr 0.4fr', padding: '10px 1rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <div>Time Logged</div>
                  <div>IP Address</div>
                  <div>Operator User</div>
                  <div>Action</div>
                  <div>Severity</div>
                  <div style={{ textAlign: 'right' }}>Actions</div>
                </div>

                {filteredLogs.map(log => {
                  const sev = getLogSeverity(log.action);
                  return (
                    <div 
                      key={log._id}
                      className="explorer-row"
                      style={{ gridTemplateColumns: '1.3fr 1.2fr 1.4fr 1fr 1fr 0.4fr', padding: '12px 1rem', cursor: 'default' }}
                    >
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                        {log.ipAddress || '192.168.1.110'}
                      </div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.userId?.email || 'System Master'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: getLogActionColor(log.action) }}>
                          {log.action}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          fontWeight: '700', 
                          color: sev.color, 
                          border: `1px solid ${sev.color}35`, 
                          background: sev.bg, 
                          padding: '2px 8px', 
                          borderRadius: '6px' 
                        }}>
                          {sev.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleDeleteLog(log._id)}
                          className="row-action-btn"
                          style={{ padding: '6px', color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.25)', borderRadius: '6px', cursor: 'pointer' }}
                          title="Delete Log"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Help Request tickets */}
        {activeTab === 'help' && (
          <div className="glass-panel" style={{ padding: '2rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>User Support Inbox</h2>
              <span style={{ fontSize: '0.8rem', color: '#ec4899', border: '1px solid rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.05)', padding: '4px 12px', borderRadius: '10px', fontWeight: '600' }}>
                {helpRequests.filter(r => r.status !== 'Resolved').length} Active cases
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {helpRequests.map(req => (
                <div 
                  key={req._id} 
                  className="glass-panel" 
                  style={{ 
                    padding: '1.5rem', 
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: `4px solid ${getStatusColor(req.status)}`,
                    background: 'rgba(15, 23, 42, 0.3)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: '600', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{req.type}</span>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: '10px', color: getStatusColor(req.status), fontWeight: '700', border: '1px solid rgba(255,255,255,0.06)' }}>{req.status}</span>
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{req.subject}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <div style={{ background: getUserAvatarColor(req.userId?.role), width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold', color: 'white' }}>
                          {req.userId?.name ? req.userId.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{req.userId?.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({req.userId?.role} • {req.userId?.department || 'General'})</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>• {new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {req.status !== 'Resolved' && (
                        <button 
                          onClick={() => handleUpdateHelpStatus(req._id, 'Resolved')}
                          className="row-action-btn" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Resolve Case
                        </button>
                      )}
                      {req.status === 'Pending' && (
                        <button 
                          onClick={() => handleUpdateHelpStatus(req._id, 'In Progress')}
                          className="row-action-btn" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#fbbf24', background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
                        >
                          Start Case
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteHelpRequest(req._id)}
                        className="row-action-btn" 
                        style={{ padding: '6px 8px', color: '#f87171', background: 'rgba(248,113,113,0.1)', borderColor: 'rgba(248,113,113,0.25)', borderRadius: '8px', cursor: 'pointer' }}
                        title="Delete Request"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: '10px', fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.03)', textAlign: 'left' }}>
                    {req.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* User Files Modal */}
      <AnimatePresence>
        {selectedUserFiles && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel" 
              style={{ maxWidth: '650px', width: '100%', padding: '2rem', maxHeight: '80vh', overflowY: 'auto', position: 'relative', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button onClick={closeFileModal} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', border: 'none' }} title="Close Dialog">
                <X size={22} />
              </button>
              
              <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
                <FileText color="#22d3ee" /> {viewingUserName}'s File Vault
              </h2>

              {selectedUserFiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                  <FileText size={40} style={{ opacity: 0.15, margin: '0 auto 1rem' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>This user has not uploaded any files yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  
                  {/* Modal Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.2fr', padding: '8px 1rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <div>File Details</div>
                    <div>File Size</div>
                    <div style={{ textAlign: 'right', paddingRight: '0.5rem' }}>Operations</div>
                  </div>

                  {/* Modal Data Rows */}
                  {selectedUserFiles.map(file => (
                    <div 
                      key={file._id} 
                      className="explorer-row" 
                      style={{ gridTemplateColumns: '1.5fr 1fr 1.2fr', padding: '12px 1rem', cursor: 'default' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(255,255,255,0.04)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={16} color="var(--text-secondary)" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.originalName}>{file.originalName}</span>
                          {file.isVerified && <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}><Check size={10} strokeWidth={3} /> Official Document</span>}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                        {(file.sizeBytes / 1024 / 1024).toFixed(2)} MB
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleDownloadUserFile(file._id, file.originalName)}
                          className="row-action-btn"
                          style={{ padding: '6px', color: '#34d399', background: 'rgba(52, 211, 153, 0.1)', borderColor: 'rgba(52, 211, 153, 0.25)', borderRadius: '6px', cursor: 'pointer' }}
                          title="Download File"
                        >
                          <Download size={14} />
                        </button>
                        
                        <button 
                          onClick={() => handleVerifyFile(file._id)}
                          className="row-action-btn"
                          style={{ padding: '6px', color: file.isVerified ? '#10b981' : '#a855f7', background: file.isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(168,85,247,0.1)', borderColor: file.isVerified ? 'rgba(16,185,129,0.25)' : 'rgba(168,85,247,0.25)', borderRadius: '6px', cursor: 'pointer' }}
                          title={file.isVerified ? 'Unverify Document' : 'Verify as Official Campus Document'}
                        >
                          <CheckCircle size={14} fill={file.isVerified ? '#10b981' : 'transparent'} />
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteUserFile(file._id)}
                          className="row-action-btn"
                          style={{ padding: '6px', color: '#f87171', background: 'rgba(248, 113, 113, 0.1)', borderColor: 'rgba(248, 113, 113, 0.25)', borderRadius: '6px', cursor: 'pointer' }}
                          title="Delete File from Server"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel" 
              style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', textAlign: 'center', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Trash2 size={32} color="#ef4444" style={{ filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' }} />
              </div>
              <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>{confirmModal.title}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6', fontSize: '0.9rem' }}>{confirmModal.message}</p>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="glass-panel"
                  style={{ flex: 1, padding: '12px', cursor: 'pointer', border: '1px solid var(--glass-border)', color: '#ffffff', fontWeight: '600', borderRadius: '10px' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px', background: '#ef4444', border: 'none', color: '#ffffff', fontWeight: '600', borderRadius: '10px' }}
                >
                  Confirm Action
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Toast Notification */}
      <AnimatePresence>
        {toast.isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              zIndex: 3000,
              background: 'var(--glass-bg-hover)',
              backdropFilter: 'blur(10px)',
              border: `1px solid ${toast.type === 'danger' ? 'rgba(239, 68, 68, 0.4)' : (toast.type === 'success' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(59, 130, 246, 0.4)')}`,
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}
          >
            {toast.type === 'danger' && <AlertCircle size={20} color="var(--danger)" />}
            {toast.type === 'success' && <CheckCircle size={20} color="var(--success)" />}
            {toast.type === 'info' && <Info size={20} color="var(--accent-primary)" />}
            <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: '500' }}>{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminDashboard;
