import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, FileText, Upload, Plus, Trash2, ArrowLeft, Download,
  LogOut, Shield, Share2, X, Search, Clock, FileImage, FileCode,
  FileVideo, Home, Layout, Info, Calendar, ChevronRight, CheckCircle, AlertCircle, Mail, Users, HelpCircle,
  Settings, Bell, MoreHorizontal
} from 'lucide-react';

const Dashboard = ({ defaultView = 'private' }) => {
  const { user, api, logout, refreshUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [items, setItems] = useState({ folders: [], files: [], currentFolder: null });
  const [departmentData, setDepartmentData] = useState({ files: [], folders: [] });
  const [recentFilesData, setRecentFilesData] = useState([]);
  const [sharedFilesData, setSharedFilesData] = useState([]);
  const [studentsData, setStudentsData] = useState([]);
  const currentView = defaultView;
  const setCurrentView = (newView) => {
    if (newView === 'overview') {
      window.location.href = '/dashboard/overview';
    } else if (newView === 'private') {
      window.location.href = '/dashboard/my-files';
    } else if (newView === 'department') {
      window.location.href = '/dashboard/department-files';
    } else if (newView === 'students') {
      window.location.href = '/dashboard/student-portfolio';
    } else if (newView === 'recent') {
      window.location.href = '/dashboard/recent';
    } else if (newView === 'shared') {
      window.location.href = '/dashboard/shared';
    }
  };
  const [currentParentId, setCurrentParentId] = useState('root');
  const [history, setHistory] = useState(['root']);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDeadline, setNewFolderDeadline] = useState('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [shareModal, setShareModal] = useState({ isOpen: false, id: null, type: 'file', isPublic: false, expiresHours: '0', downloadLimit: '' });
  const [notifyModal, setNotifyModal] = useState({ isOpen: false, fileId: null, target: 'department' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [deleteAccountModal, setDeleteAccountModal] = useState({ isOpen: false, reason: '' });
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserFiles, setSelectedUserFiles] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpRequest, setHelpRequest] = useState({ subject: '', message: '', type: 'General' });
  const [selectedItem, setSelectedItem] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewDropdown, setShowNewDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Submission', desc: `Amrita University submitted 'lab_1.zip' into Drop Folder.`, time: '5m ago', unread: true },
    { id: 2, title: 'Department Doc Published', desc: `Test Faculty published 'Syllabus_2026.pdf' to CSE Department.`, time: '1h ago', unread: true },
    { id: 3, title: 'Storage Alert', desc: 'Your drive storage usage is approaching 70% capacity.', time: '1d ago', unread: false }
  ]);
  const fileInputRef = useRef(null);

  const showToast = (message, type = 'info') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 4000);
  };

  const fetchContents = async (folderId) => {
    try {
      console.log('[Dashboard Debug] Fetching contents for:', folderId);
      const res = await api.get(`/folders/${folderId}?_t=${Date.now()}`);
      console.log('[Dashboard Debug] Fetched contents successfully:', res.data);
      setItems(res.data);
    } catch (err) {
      console.error('[Dashboard Debug] Error fetching contents:', err);
    }
  };

  const refreshViewContents = () => {
    if (currentParentId !== 'root') {
      fetchContents(currentParentId);
    } else if (currentView === 'private') {
      fetchContents(currentParentId);
    } else if (currentView === 'department') {
      fetchDepartmentFiles();
    } else if (currentView === 'recent') {
      fetchRecentFiles();
    } else if (currentView === 'shared') {
      fetchSharedFiles();
    }
  };

  const fetchDepartmentFiles = async () => {
    try {
      console.log('[Dashboard Debug] Fetching department files');
      const res = await api.get(`/files/department?_t=${Date.now()}`);
      console.log('[Dashboard Debug] Fetched department files successfully:', res.data);
      setDepartmentData(res.data);
    } catch (err) {
      console.error('[Dashboard Debug] Error fetching department files:', err);
    }
  };

  const fetchRecentFiles = async () => {
    try {
      const res = await api.get('/files/recent');
      setRecentFilesData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSharedFiles = async () => {
    try {
      const res = await api.get('/files/shared-by-me');
      setSharedFilesData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartmentStudents = async () => {
    try {
      const res = await api.get('/auth/students');
      setStudentsData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    console.log('[Dashboard Debug] Effect triggered. currentView:', currentView, 'currentParentId:', currentParentId);

    // Reset scroll positions of workspace and lists on view or folder change
    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;
    
    const explorerEl = document.querySelector('.file-explorer-row')?.parentElement;
    if (explorerEl) explorerEl.scrollTop = 0;

    const fetchData = () => {
      console.log('[Dashboard Debug] Running auto-refresh poll for view:', currentView, 'parent:', currentParentId);
      if (currentView === 'overview') {
        fetchDepartmentFiles();
        if (user?.role === 'faculty' || user?.role === 'staff' || user?.role === 'admin') {
          fetchDepartmentStudents();
        }
      } else if (currentView === 'private' || (currentView === 'department' && currentParentId !== 'root')) {
        fetchContents(currentParentId);
      } else if (currentView === 'department') {
        fetchDepartmentFiles();
      } else if (currentView === 'recent') {
        fetchRecentFiles();
      } else if (currentView === 'shared') {
        fetchSharedFiles();
      } else if (currentView === 'students') {
        fetchDepartmentStudents();
      }
    };

    // Fetch immediately on mount or state change
    fetchData();

    // Setup auto-refresh every 15 seconds
    const intervalId = setInterval(fetchData, 15000);



    // Cleanup interval on unmount or dependency change
    return () => {
      console.log('[Dashboard Debug] Cleaning up interval:', intervalId);
      clearInterval(intervalId);
    };
  }, [currentParentId, currentView, user]);

  // Dynamic Notifications Effect
  useEffect(() => {
    const fetchNotificationFiles = async () => {
      try {
        const res = await api.get('/files/recent');
        const files = res.data || [];
        if (files.length > 0) {
          setNotifications(prevNotifs => {
            const newNotifs = files.slice(0, 5).map((file, index) => {
              const id = file._id || index;
              const existing = prevNotifs.find(n => n.id === id);
              return {
                id,
                title: 'Recent Activity',
                desc: `'${file.originalName}' was modified.`,
                time: new Date(file.updatedAt || file.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unread: existing ? existing.unread : true
              };
            });
            return newNotifs;
          });
        }
      } catch (err) {
        console.error('Failed to fetch recent files for notifications', err);
      }
    };
    
    fetchNotificationFiles();
    const intervalId = setInterval(fetchNotificationFiles, 15000);
    return () => clearInterval(intervalId);
  }, [api]);

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.post('/folders', {
        name: newFolderName,
        parentId: currentParentId === 'root' ? null : currentParentId,
        deadline: newFolderDeadline || null,
        isPublicToDepartment: currentView === 'department'
      });
      setNewFolderName('');
      setNewFolderDeadline('');
      setShowFolderModal(false);
      showToast('Folder created successfully', 'success');
      refreshViewContents();
    } catch (err) {
      console.error(err);
      showToast('Failed to create folder', 'danger');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (currentParentId !== 'root') {
      formData.append('folderId', currentParentId);
    }

    if (currentView === 'department') {
      formData.append('isPublicToDepartment', 'true');
    }

    try {
      await api.post('/files', formData);
      refreshViewContents();
      refreshUser();
      showToast('File uploaded successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'File upload failed', 'danger');
    } finally {
      e.target.value = ''; // Reset input to allow uploading the same file again
    }
  };

  const handleDeleteFolder = (id, e) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Folder',
      message: 'Are you sure you want to delete this folder and all its contents? This cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/folders/${id}`);
          refreshViewContents();
          refreshUser();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleDeleteFile = (id, e) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete File',
      message: 'Are you sure you want to permanently delete this file?',
      onConfirm: async () => {
        try {
          await api.delete(`/files/${id}`);
          refreshViewContents();
          refreshUser();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleDownloadFile = async (id, originalName, e) => {
    e.stopPropagation();
    try {
      const res = await api.get(`/files/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleTogglePublish = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/files/${id}/publish`);
      refreshViewContents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFolderPublish = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/folders/${id}/publish`);
      showToast('Folder visibility updated', 'success');
      refreshViewContents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareFolder = (folder, e) => {
    e.stopPropagation();
    setShareModal({ ...shareModal, isOpen: true, id: folder._id, type: 'folder', isPublic: folder.isPublicToDepartment });
  };

  const handleCreateDropFolder = async (id) => {
    try {
      const res = await api.post(`/folders/share/${id}`);
      showToast('Drop Folder Link Created & Copied!', 'success');
      const shareUrl = `${window.location.origin}/drop/${res.data.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      refreshViewContents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleShareFile = async () => {
    try {
      const res = await api.post(`/files/share/${shareModal.id}`, {
        expiresHours: parseInt(shareModal.expiresHours),
        downloadLimit: shareModal.downloadLimit ? parseInt(shareModal.downloadLimit) : null
      });

      const shareUrl = `${window.location.origin}/shared/${res.data.shareToken}`;
      navigator.clipboard.writeText(shareUrl);
      showToast('Secure link copied to clipboard!', 'success');
      setShareModal({ ...shareModal, isOpen: false });
      refreshViewContents();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to generate link', 'danger');
    }
  };

  const handleRevokeLink = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.put(`/files/${id}/revoke`);
      if (selectedItem && selectedItem._id === id) {
        setSelectedItem({ ...selectedItem, shareToken: null, shareExpiresAt: null, shareDownloadLimit: null });
      }
      refreshViewContents();
      showToast('The share link has been successfully revoked.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to revoke link', 'danger');
    }
  };

  const handleNotify = async () => {
    try {
      const res = await api.post(`/files/${notifyModal.fileId}/notify`, { target: notifyModal.target });
      showToast(res.data.message || 'Notification sent successfully!', 'success');
      setNotifyModal({ isOpen: false, fileId: null, target: 'department' });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to send notification', 'danger');
    }
  };

  const handleDeleteAccount = () => {
    setDeleteAccountModal({ isOpen: true, reason: '' });
  };

  const confirmDeleteAccount = async () => {
    try {
      await api.delete('/auth/me', { data: { reason: deleteAccountModal.reason } });
      logout();
    } catch (error) {
      showToast('Failed to delete account. Admins cannot delete themselves here.', 'danger');
      setDeleteAccountModal({ isOpen: false, reason: '' });
    }
  };

  const handleHelpSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/help/request', helpRequest);
      showToast('Help request sent to admin successfully!', 'success');
      setShowHelpModal(false);
      setHelpRequest({ subject: '', message: '', type: 'General' });
    } catch (err) {
      console.error('Help Request Error:', err);
      showToast('Failed to send request. Please try again.', 'danger');
    }
  };

  const handleRevokeFolderLink = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/folders/${id}/revoke`);
      refreshViewContents();
      showToast('Drop Folder link has been revoked.', 'success');
    } catch (err) {
      showToast('Failed to revoke folder link', 'danger');
    }
  };

  const navigateToFolder = (id) => {
    setHistory([...history, id]);
    setCurrentParentId(id);
  };

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      setCurrentParentId(newHistory[newHistory.length - 1]);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <FileImage size={48} color="#a855f7" />;
    if (mimeType?.startsWith('video/')) return <FileVideo size={48} color="#ec4899" />;
    if (mimeType?.includes('javascript') || mimeType?.includes('html') || mimeType?.includes('css')) return <FileCode size={48} color="#3b82f6" />;
    return <FileText size={48} color="var(--text-secondary)" />;
  };

  const getDeadlineStatus = (deadline) => {
    if (!deadline) return null;
    const diff = new Date(deadline) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { label: 'Past Deadline', color: 'var(--danger)' };
    if (days === 0) return { label: 'Due Today', color: 'var(--danger)' };
    if (days <= 3) return { label: `${days}d left`, color: '#f59e0b' };
    return { label: `${days}d left`, color: 'var(--success)' };
  };

  const isBrowsingFolder = currentParentId !== 'root';
  const foldersToFilter = (currentView === 'private' || isBrowsingFolder) ? (items?.folders || []) : (currentView === 'department' ? (departmentData?.folders || []) : []);
  const filteredFolders = foldersToFilter.filter(f => f && f.name && f.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const filesToFilter = (currentView === 'private' || isBrowsingFolder) ? (items?.files || []) : (currentView === 'department' ? (departmentData?.files || []) : (currentView === 'recent' ? recentFilesData : sharedFilesData));

  const filteredFiles = filesToFilter.filter(f => {
    if (!f) return false;
    const term = searchTerm.toLowerCase();
    const matchName = f.originalName?.toLowerCase()?.includes(term);
    const matchCategory = f.category?.toLowerCase()?.includes(term);
    const matchDepartment = f.department?.toLowerCase()?.includes(term);
    const matchAcademicYear = f.academicYear?.toLowerCase()?.includes(term);
    const matchOwner = f.ownerId?.name?.toLowerCase()?.includes(term) || f.ownerId?.role?.toLowerCase()?.includes(term);
    return matchName || matchCategory || matchDepartment || matchAcademicYear || matchOwner;
  });

  const filteredStudents = currentView === 'students' ? studentsData.filter(student => {
    if (!student) return false;
    const term = searchTerm.toLowerCase();
    const matchName = student.name?.toLowerCase()?.includes(term);
    const matchEmail = student.email?.toLowerCase()?.includes(term);
    const matchRollNo = student.rollNo?.toLowerCase()?.includes(term);
    const matchDept = student.department?.toLowerCase()?.includes(term);
    return matchName || matchEmail || matchRollNo || matchDept;
  }) : [];

  // We no longer have a separate recent files UI block, they are displayed in the main grid
  const recentFiles = [];

  const getBreadcrumbs = () => {
    if (currentView !== 'private' && currentView !== 'department') return null;
    if (currentParentId === 'root' && currentView !== 'department') return null;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            setCurrentParentId('root');
            setHistory(['root']);
            if (currentView === 'department') fetchDepartmentFiles();
          }}
          className="glass-panel"
          style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)', cursor: 'pointer' }}
        >
          <Home size={14} /> {currentView === 'private' ? 'My Drive' : 'Dept Drive'}
        </button>

        {currentParentId !== 'root' && (
          <>
            <ChevronRight size={14} color="var(--text-secondary)" />
            <button
              onClick={handleBack}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            {items.currentFolder && (
              <>
                <ChevronRight size={14} color="var(--text-secondary)" />
                <span className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
                  {items.currentFolder.name}
                </span>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  const getAllowanceBytes = () => {
    if (user?.role === 'admin') return 10 * 1024 * 1024 * 1024; // 10 GB
    if (user?.role === 'faculty' || user?.role === 'staff') return 1 * 1024 * 1024 * 1024; // 1 GB
    return 100 * 1024 * 1024; // 100 MB for students
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0.00 MB';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) {
      return (mb / 1024).toFixed(2) + ' GB';
    }
    return mb.toFixed(2) + ' MB';
  };

  const allowanceBytes = getAllowanceBytes();
  const totalUsageBytes = user?.stats?.totalUsageBytes || 0;
  const usagePercent = Math.min(100, Math.max(0, Math.round((totalUsageBytes / allowanceBytes) * 100)));
  const formattedUsed = formatBytes(totalUsageBytes);
  const formattedTotal = formatBytes(allowanceBytes);

  const getCategoryStats = () => {
    const files = filesToFilter || [];
    let docBytes = 0;
    let photoBytes = 0;
    let otherBytes = 0;

    files.forEach(f => {
      if (!f) return;
      const mime = f.mimeType?.toLowerCase() || '';
      if (mime.startsWith('image/')) {
        photoBytes += f.sizeBytes;
      } else if (mime.includes('pdf') || mime.includes('word') || mime.includes('docx') || mime.includes('text') || f.category) {
        docBytes += f.sizeBytes;
      } else {
        otherBytes += f.sizeBytes;
      }
    });

    const total = docBytes + photoBytes + otherBytes;
    if (total === 0) {
      return {
        docPercent: 0,
        photoPercent: 0,
        otherPercent: 0,
        docFormatted: '0.00 MB',
        photoFormatted: '0.00 MB',
        otherFormatted: '0.00 MB'
      };
    }

    return {
      docPercent: Math.round((docBytes / total) * 100),
      photoPercent: Math.round((photoBytes / total) * 100),
      otherPercent: Math.round((otherBytes / total) * 100),
      docFormatted: formatBytes(docBytes),
      photoFormatted: formatBytes(photoBytes),
      otherFormatted: formatBytes(otherBytes)
    };
  };

  const catStats = getCategoryStats();

  const getDynamicTags = (file) => {
    const tags = [];
    if (file.category && file.category !== 'Uncategorized') {
      tags.push(file.category);
    }
    if (file.department) {
      tags.push(file.department);
    }
    if (file.academicYear) {
      tags.push(file.academicYear);
    }
    if (file.isVerified) {
      tags.push('Official');
    }
    if (tags.length === 0) {
      const ext = file.originalName?.split('.').pop()?.toUpperCase();
      if (ext) tags.push(ext);
      tags.push('File');
    }
    return tags.slice(0, 3);
  };

  const getDynamicFolderTags = (folder) => {
    const tags = [];
    if (folder.department) {
      tags.push(folder.department);
    }
    if (folder.isDropFolder) {
      tags.push('Submissions');
    }
    if (folder.deadline) {
      tags.push('Deadline');
    }
    if (tags.length === 0) {
      tags.push('Folder');
      tags.push('Workspace');
    }
    return tags.slice(0, 3);
  };

  const getTagClass = (tag) => {
    const lower = tag.toLowerCase();
    if (lower.includes('assignment') || lower.includes('cse') || lower.includes('zip') || lower.includes('rar') || lower.includes('archive')) return 'badge-tag-ai'; // green
    if (lower.includes('dataset') || lower.includes('mca') || lower.includes('word') || lower.includes('docx') || lower.includes('doc')) return 'badge-tag-dataset'; // blue
    if (lower.includes('grant') || lower.includes('pdf') || lower.includes('official') || lower.includes('verified')) return 'badge-tag-grant'; // purple
    if (lower.includes('abstract') || lower.includes('ece') || lower.includes('syllabus')) return 'badge-tag-abstract'; // cyan
    if (lower.includes('review') || lower.includes('submissions') || lower.includes('portfolio') || lower.includes('lecture')) return 'badge-tag-review'; // pink
    if (lower.includes('campus') || lower.includes('circular')) return 'badge-tag-campus'; // light-green
    if (lower.includes('policy') || lower.includes('lab')) return 'badge-tag-policy'; // sky-blue
    if (lower.includes('secure') || lower.includes('deadline')) return 'badge-tag-secure'; // gold
    return 'badge-tag-ai';
  };

  const getFileIconRedesigned = (mimeType) => {
    if (mimeType?.startsWith('image/')) return <FileImage size={20} color="#a855f7" />;
    if (mimeType?.startsWith('video/')) return <FileVideo size={20} color="#ec4899" />;
    if (mimeType?.includes('zip') || mimeType?.includes('octet-stream')) return <FileCode size={20} color="#fbbf24" />; // Orange/gold ZIP
    if (mimeType?.includes('word') || mimeType?.includes('docx') || mimeType?.includes('officedocument')) return <FileText size={20} color="#3b82f6" />; // Blue DOCX
    if (mimeType?.includes('pdf')) return <FileText size={20} color="#ef4444" />; // Red PDF
    return <FileText size={20} color="var(--text-secondary)" />;
  };

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', overflow: 'hidden' }}>

      {/* Sidebar Navigation */}
      <aside className="glass-panel sidebar" style={{
        width: sidebarCollapsed ? '80px' : '260px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        margin: '1.25rem 0 1.25rem 1.25rem',
        height: 'calc(100vh - 2.5rem)',
        padding: '1.5rem 1rem',
        borderRadius: '24px'
      }}>
        {/* Brand Logo Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem', padding: '0 8px' }}>
          <div className="logo-s-badge">S</div>
          {!sidebarCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="brand-title">Secure Campus</span>
              <span className="brand-subtitle">File Share</span>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className={`sidebar-item ${currentView === 'overview' ? 'active' : ''}`} onClick={() => setCurrentView('overview')}>
            <Home size={18} />
            {!sidebarCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Overview</span>}
          </div>
          <div className={`sidebar-item ${currentView === 'private' ? 'active' : ''}`} onClick={() => { setCurrentView('private'); setCurrentParentId('root'); setHistory(['root']); }}>
            <Folder size={18} />
            {!sidebarCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>My Files</span>}
          </div>
          <div className={`sidebar-item ${currentView === 'department' ? 'active' : ''}`} onClick={() => { setCurrentView('department'); setCurrentParentId('root'); setHistory(['root']); }}>
            <Layout size={18} />
            {!sidebarCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Dept Files</span>}
          </div>
          {(user?.role === 'faculty' || user?.role === 'staff' || user?.role === 'admin') && (
            <div className={`sidebar-item ${currentView === 'students' ? 'active' : ''}`} onClick={() => setCurrentView('students')}>
              <Users size={18} />
              {!sidebarCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Student Portfolios</span>}
            </div>
          )}
          <div className={`sidebar-item ${currentView === 'recent' ? 'active' : ''}`} onClick={() => { setCurrentView('recent'); setSearchTerm(''); }}>
            <Clock size={18} />
            {!sidebarCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Recent</span>}
          </div>
          <div className={`sidebar-item ${currentView === 'shared' ? 'active' : ''}`} onClick={() => { setCurrentView('shared'); setSearchTerm(''); }}>
            <Share2 size={18} />
            {!sidebarCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Shared</span>}
          </div>
          {user?.role === 'admin' && (
            <div className="sidebar-item" onClick={() => navigate('/admin')} style={{ color: 'var(--danger)' }}>
              <Shield size={18} />
              {!sidebarCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Admin Panel</span>}
            </div>
          )}
        </nav>

        {/* Bottom Pinned Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem', marginTop: 'auto' }}>
          <div className="sidebar-item" onClick={handleDeleteAccount}>
            <Settings size={18} />
            {!sidebarCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Settings</span>}
          </div>
          {user?.role !== 'admin' && (
            <div className="sidebar-item" onClick={() => setShowHelpModal(true)}>
              <HelpCircle size={18} />
              {!sidebarCollapsed && <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Support</span>}
            </div>
          )}
        </div>
      </aside>

      {/* Main Workspace */}
      <main style={{
        flexGrow: 1,
        padding: '1.25rem 2rem 1.25rem 2rem',
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}>

        {/* Top Header Row (Search & Action Buttons) */}
        <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1.5rem', gap: '1.25rem', width: '100%' }}>

          {/* Magnifying glass smart search */}
          <div className="search-container glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0.6rem 1.25rem', width: '280px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', opacity: currentView === 'overview' ? 0.5 : 1 }}>
            <Search size={16} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder={currentView === 'overview' ? "Open a folder to search..." : "Search Files & Folders..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={currentView === 'overview'}
              style={{ background: 'transparent', border: 'none', padding: 0, width: '100%', fontSize: '0.85rem', color: 'var(--text-primary)', outline: 'none', cursor: currentView === 'overview' ? 'not-allowed' : 'text' }}
            />
          </div>

          {/* Header Action Group */}
          <div className="header-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {/* New Action Dropdown Trigger */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNewDropdown(!showNewDropdown)}
                className="btn-new-gradient"
                style={{ border: 'none', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', borderRadius: '8px' }}
              >
                <Plus size={16} strokeWidth={2.5} /> <span>New</span>
              </button>
              <AnimatePresence>
                {showNewDropdown && (
                  <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setShowNewDropdown(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="glass-panel"
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '42px',
                        width: '180px',
                        padding: '8px',
                        zIndex: 999,
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }}
                    >
                      <div
                        className="sidebar-item"
                        onClick={() => { setShowFolderModal(true); setShowNewDropdown(false); }}
                        style={{ padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        <Folder size={16} color="#a855f7" />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>New Folder</span>
                      </div>
                      <div
                        className="sidebar-item"
                        onClick={() => {
                          setShowNewDropdown(false);
                          setTimeout(() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.click();
                            }
                          }, 50);
                        }}
                        style={{ padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}
                      >
                        <Upload size={16} color="#22d3ee" />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Upload File</span>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
            </div>

            {/* Bell Notifications Badge */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowNewDropdown(false);
                }}
                className="glass-panel"
                style={{ padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                title="Notifications"
              >
                <Bell size={18} />
                {notifications.some(n => n.unread) && (
                  <span style={{ position: 'absolute', top: '2px', right: '2px', width: '8px', height: '8px', background: '#ec4899', borderRadius: '50%', boxShadow: '0 0 8px #ec4899' }}></span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} onClick={() => setShowNotifications(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="notification-dropdown glass-panel"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)' }}>Notifications</h4>
                        <button
                          onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                          style={{ background: 'transparent', border: 'none', color: '#22d3ee', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer' }}
                        >
                          Mark all read
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
                        {notifications.map(n => (
                          <div key={n.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px', padding: '8px', borderRadius: '8px', background: n.unread ? 'rgba(34, 211, 238, 0.05)' : 'transparent', borderLeft: n.unread ? '3px solid #22d3ee' : '3px solid transparent' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-primary)' }}>{n.title}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{n.time}</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4', textAlign: 'left' }}>{n.desc}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Log Out Option */}
            <button onClick={logout} className="glass-panel" style={{ padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--danger)' }} title="Sign Out">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Row 1 Deck: Welcome back banner + Storage Usage Gauge */}
        {currentView === 'overview' && (
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>

            {/* Welcome Card */}
            <div className="glass-panel welcome-card-premium" style={{ flex: '2', padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: '350px', borderRadius: '24px' }}>
              <div style={{
                position: 'relative',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '2px solid #8b5cf6',
                padding: '2px',
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  color: 'white',
                  fontSize: '1.4rem'
                }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                </div>
              </div>
              <div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Welcome back,</p>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {user?.name || ''}
                </h2>
                <p style={{ fontSize: '0.8rem', color: '#22d3ee', fontWeight: '500', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {user?.role} • {user?.department || 'General'} Department
                </p>
              </div>
            </div>

            {/* Storage Usage Card */}
            <div className="glass-panel" style={{ flex: '1.2', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '280px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Storage Usage</h3>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', height: '90px' }}>
                <svg viewBox="0 0 100 50" width="100%" height="80px" className="storage-progress-svg" style={{ transform: 'scale(1.2)', transformOrigin: 'center bottom' }}>
                  <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke="url(#storageGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray="125.6" strokeDashoffset={125.6 * (1 - (usagePercent / 100))} />
                  <defs>
                    <linearGradient id="storageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', bottom: '2px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Used:</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>{formattedUsed} / {formattedTotal}</span>
                  <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#22d3ee', marginTop: '1px' }}>{usagePercent}%</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.75rem', marginTop: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="legend-dot" style={{ background: '#22d3ee' }}></span>
                    <span style={{ color: 'var(--text-secondary)' }}>Document Files ({catStats.docFormatted})</span>
                  </div>
                  <span style={{ fontWeight: '600' }}>{catStats.docPercent}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="legend-dot" style={{ background: '#a855f7' }}></span>
                    <span style={{ color: 'var(--text-secondary)' }}>Photos ({catStats.photoFormatted})</span>
                  </div>
                  <span style={{ fontWeight: '600' }}>{catStats.photoPercent}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="legend-dot" style={{ background: 'rgba(255,255,255,0.25)' }}></span>
                    <span style={{ color: 'var(--text-secondary)' }}>Other Files ({catStats.otherFormatted})</span>
                  </div>
                  <span style={{ fontWeight: '600' }}>{catStats.otherPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Row 2: Team Folders */}
        {currentView === 'overview' && (
          <section style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Team Folders</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="team-folder-card" onClick={() => { setCurrentView('private'); setCurrentParentId('root'); setHistory(['root']); }} style={{ cursor: 'pointer' }}>
                <Folder size={28} color="#a855f7" fill="rgba(168, 85, 247, 0.15)" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '8px' }}>My File's</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.stats?.formattedUsage || '0.00 MB'} Used</p>
                <p style={{ fontSize: '0.75rem', color: '#22d3ee', fontWeight: '500', marginTop: '2px' }}>{user?.stats?.totalFiles || 0} Files • Private</p>
              </div>
              <div className="team-folder-card" onClick={() => { setCurrentView('department'); setCurrentParentId('root'); setHistory(['root']); }} style={{ cursor: 'pointer' }}>
                <Folder size={28} color="#22d3ee" fill="rgba(34, 211, 238, 0.15)" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '8px' }}>Department File's</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{departmentData?.files?.length || 0} Shared Documents</p>
                <p style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: '500', marginTop: '2px' }}>{user?.department || 'General'} Dept Shared</p>
              </div>
              <div className="team-folder-card" onClick={() => { if (user?.role === 'faculty' || user?.role === 'staff' || user?.role === 'admin') setCurrentView('students'); }} style={{ cursor: user?.role === 'student' ? 'not-allowed' : 'pointer', opacity: user?.role === 'student' ? 0.6 : 1 }}>
                <Folder size={28} color="#ec4899" fill="rgba(236, 72, 153, 0.15)" style={{ marginBottom: '12px' }} />
                <h4 style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '8px' }}>Student Portfolios</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{studentsData?.length || 0} Student Accounts</p>
                <p style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: '500', marginTop: '2px' }}>{user?.role === 'student' ? 'Faculty Protected' : 'Active Directory'}</p>
              </div>
            </div>
          </section>
        )}

        {/* Row 3: My Files Explorer */}
        {currentView !== 'overview' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', marginTop: '0.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                {currentView === 'private' ? 'My Files' : (currentView === 'department' ? 'Department Files' : (currentView === 'students' ? 'Student Portfolios' : (currentView === 'recent' ? 'Recent Files' : 'Shared Links')))}
              </h2>
            </div>

            {/* Explorer Table Container */}
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '24px', flexGrow: 1, display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.06)' }}>

              {/* Navigation Breadcrumbs inside File Explorer */}
              <div className="breadcrumb-container" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                {currentParentId !== 'root' && (
                  <button
                    onClick={handleBack}
                    className="row-action-btn"
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      marginRight: '12px',
                      fontWeight: '600',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff'
                    }}
                  >
                    <ArrowLeft size={14} strokeWidth={2.5} color="#ffffff" /> Back
                  </button>
                )}
                {currentParentId === 'root' ? (
                  <span className="breadcrumb-active" style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                    {currentView === 'private' ? 'My Files' : (currentView === 'department' ? 'Department Files' : (currentView === 'students' ? 'Student Portfolio' : (currentView === 'recent' ? 'Recent Files' : 'Shared Links')))}
                  </span>
                ) : (
                  <>
                    <span
                      onClick={() => {
                        setCurrentParentId('root');
                        setHistory(['root']);
                        if (currentView === 'department') fetchDepartmentFiles();
                      }}
                      className="breadcrumb-item"
                      style={{ cursor: 'pointer' }}
                    >
                      {currentView === 'private' ? 'My Files' : (currentView === 'department' ? 'Department Files' : (currentView === 'students' ? 'Student Portfolio' : (currentView === 'recent' ? 'Recent Files' : 'Shared Links')))}
                    </span>
                    <ChevronRight size={12} color="var(--text-secondary)" />
                    <span className="breadcrumb-active">
                      {items.currentFolder ? items.currentFolder.name : 'Folder'}
                    </span>
                  </>
                )}
              </div>

              {/* Table Layout Column Headers */}
              <div className="file-explorer-header">
                <div></div>
                <div>Name</div>
                <div>{currentView === 'students' ? 'Email' : 'Date Modified'}</div>
                <div>{currentView === 'students' ? 'Roll Number' : 'Size'}</div>
                <div>{currentView === 'students' ? 'Department' : 'Owner'}</div>
                <div style={{ textAlign: 'right', paddingRight: '1rem' }}>{currentView === 'students' ? 'Status' : 'Tags'}</div>
              </div>

              {/* Explorer List rows container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', overflowY: 'auto', flexGrow: 1 }}>

                {currentParentId !== 'root' && (
                  <div onClick={handleBack} className="file-explorer-row" style={{ fontStyle: 'italic', color: '#22d3ee' }}>
                    <div></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ArrowLeft size={16} />
                      <span>Go Back</span>
                    </div>
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                )}

                {/* Render Students */}
                {currentView === 'students' && filteredStudents.map(student => (
                  <div
                    key={student._id}
                    className="file-explorer-row"
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#ec4899' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      <div style={{ background: 'rgba(236, 72, 153, 0.1)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={18} color="#ec4899" />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {student.name}
                        </span>
                        <span className="mobile-only-info" style={{ display: 'none', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {student.rollNo || 'No Roll No.'} • {student.email}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {student.email}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {student.rollNo || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {student.department}
                    </div>
                    <div className="action-trigger-area">
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <span className="badge-tag-grant" style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}>
                          Active
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Render Folders */}
                {filteredFolders.map(folder => {
                  const folderTags = getDynamicFolderTags(folder);
                  return (
                    <div
                      key={folder._id}
                      onClick={() => { navigateToFolder(folder._id); setSelectedItem(null); }}
                      className="file-explorer-row"
                    >
                      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
                        <input type="checkbox" style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#22d3ee' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Folder size={18} color="#a855f7" fill="rgba(168, 85, 247, 0.2)" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {folder.name}
                          </span>
                          <span className="mobile-only-info" style={{ display: 'none', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {folder.isDropFolder ? 'Submissions Drop' : 'Folder'} • {folder.ownerId?.name || user?.name || 'Sarah Chen'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {folder.deadline ? new Date(folder.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 24, 2023'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {folder.isDropFolder ? 'Submissions' : '1.2 GB'}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {folder.ownerId?.name || user?.name || 'Sarah Chen'}
                      </div>
                      <div className="action-trigger-area" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {(folder.ownerId === user?._id || folder.ownerId?._id === user?._id || folder.ownerId?.toString() === user?._id?.toString() || user?.role === 'admin') && (
                            <>
                              {folder.shareToken ? (
                                <button
                                  onClick={(e) => handleRevokeFolderLink(folder._id, e)}
                                  className="row-action-btn"
                                  style={{ color: 'white', background: 'rgba(239, 68, 68, 0.25)', borderColor: 'rgba(239, 68, 68, 0.45)', fontSize: '0.8rem', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '500' }}
                                >
                                  <X size={14} /> <span>Close Drop</span>
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => handleShareFolder(folder, e)}
                                  className="row-action-btn"
                                  style={{ color: '#22d3ee', background: 'rgba(34, 211, 238, 0.12)', borderColor: 'rgba(34, 211, 238, 0.35)', fontSize: '0.8rem', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '500' }}
                                >
                                  <Share2 size={14} /> <span>Enable Drop</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => handleDeleteFolder(folder._id, e)}
                                className="row-action-btn"
                                style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.12)', borderColor: 'rgba(248, 113, 113, 0.35)', fontSize: '0.8rem', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '500' }}
                              >
                                <Trash2 size={14} /> <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Render Files */}
                {filteredFiles.map(file => {
                  const fileTags = getDynamicTags(file);
                  return (
                    <div
                      key={file._id}
                      onClick={() => setSelectedItem(file)}
                      className="file-explorer-row"
                    >
                      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
                        <input type="checkbox" style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#22d3ee' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {getFileIconRedesigned(file.mimeType)}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>
                            {file.originalName}
                          </span>
                          <span className="mobile-only-info" style={{ display: 'none', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {(file.sizeBytes / 1024 / 1024).toFixed(1)} MB • {file.ownerId?.name || user?.name || 'Sarah Chen'}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(file.createdAt || '2023-10-26').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {(file.sizeBytes / 1024 / 1024).toFixed(1)} MB
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {file.ownerId?.name || user?.name || 'Sarah Chen'}
                      </div>
                      <div className="action-trigger-area" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={(e) => handleDownloadFile(file._id, file.originalName, e)}
                            className="row-action-btn"
                            style={{ color: '#34d399', background: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.35)', fontSize: '0.8rem', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '500' }}
                          >
                            <Download size={14} /> <span>Download</span>
                          </button>
                          {(file.ownerId?._id === user?._id || file.ownerId === user?._id || file.ownerId?._id?.toString() === user?._id?.toString() || user?.role === 'admin') && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); setShareModal({ ...shareModal, isOpen: true, id: file._id, type: 'file', isPublic: file.isPublicToDepartment }); }}
                                className="row-action-btn"
                                style={{ color: '#22d3ee', background: 'rgba(34, 211, 238, 0.12)', borderColor: 'rgba(34, 211, 238, 0.35)', fontSize: '0.8rem', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '500' }}
                              >
                                <Share2 size={14} /> <span>Share</span>
                              </button>
                              <button
                                onClick={(e) => handleDeleteFile(file._id, e)}
                                className="row-action-btn"
                                style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.12)', borderColor: 'rgba(248, 113, 113, 0.35)', fontSize: '0.8rem', padding: '8px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '500' }}
                              >
                                <Trash2 size={14} /> <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredFolders.length === 0 && filteredFiles.length === 0 && (currentView !== 'students' || filteredStudents.length === 0) && (
                  <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <Search size={48} style={{ opacity: 0.15, margin: '0 auto 1rem', color: 'var(--text-secondary)' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{searchTerm ? 'No search results found.' : 'This workspace folder is currently empty.'}</p>
                  </div>
                )}

              </div>
            </div>
          </>
        )}

        {/* Dynamic Detail slide-in Pane (Fades/Slides floating on right) */}
        <AnimatePresence>
          {selectedItem && (
            <div className="detail-pane-container" style={{ position: 'absolute', right: '2rem', top: '6rem', zIndex: 90 }}>
                <motion.div
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 300, opacity: 0 }}
                  className="glass-panel dashboard-detail-pane"
                  style={{
                    width: '320px',
                    padding: '1.5rem',
                    height: 'calc(100vh - 8rem)',
                    overflowY: 'auto',
                    border: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                    background: 'rgba(15, 23, 42, 0.8)'
                  }}
                >
                  <button onClick={() => setSelectedItem(null)} style={{ float: 'right', background: 'transparent', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                  <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1.5rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                      {getFileIconRedesigned(selectedItem.mimeType)}
                    </div>
                    <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedItem.originalName}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>File Details</p>
                    {selectedItem.category && selectedItem.category !== 'Uncategorized' && (
                      <div style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.75rem', background: 'rgba(34, 211, 238, 0.15)', color: '#22d3ee', padding: '3px 8px', borderRadius: '8px', border: '1px solid rgba(34, 211, 238, 0.2)' }}>
                        {selectedItem.category}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
                    {selectedItem.isVerified && (
                      <div style={{ background: 'rgba(52, 211, 153, 0.1)', padding: '0.75rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(52, 211, 153, 0.15)' }}>
                        <CheckCircle size={16} color="var(--success)" />
                        <p style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: '600' }}>Official Verified Campus Document</p>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Info size={14} color="var(--accent-primary)" />
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Size</p>
                        <p style={{ fontSize: '0.85rem' }}>{(selectedItem.sizeBytes / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    {selectedItem.ownerId && selectedItem.ownerId.name && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Shield size={14} color="#a855f7" />
                        <div>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Uploader</p>
                          <p style={{ fontSize: '0.85rem' }}>{selectedItem.ownerId.name} ({selectedItem.ownerId.role})</p>
                        </div>
                      </div>
                    )}
                    {selectedItem.shareToken && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(236, 72, 153, 0.1)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(236, 72, 153, 0.15)' }}>
                        <Share2 size={14} color="#ec4899" />
                        <div style={{ flexGrow: 1 }}>
                          <p style={{ fontSize: '0.75rem', color: '#ec4899' }}>Active Share Link</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>Shared with students.</p>
                        </div>
                        <button
                          onClick={(e) => handleRevokeLink(selectedItem._id, e)}
                          className="row-action-btn"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'var(--danger)', border: 'none', color: 'white' }}
                        >
                          Revoke
                        </button>
                      </div>
                    )}
                    {(user?.role === 'faculty' || user?.role === 'staff') && currentView === 'private' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Layout size={14} color={selectedItem.isPublicToDepartment ? "var(--success)" : "var(--text-secondary)"} />
                        <div style={{ flexGrow: 1 }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dept Visibility</p>
                          <p style={{ fontSize: '0.85rem', color: selectedItem.isPublicToDepartment ? "var(--success)" : "var(--text-primary)" }}>
                            {selectedItem.isPublicToDepartment ? 'Visible to Dept' : 'Private'}
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleTogglePublish(selectedItem._id, e)}
                          className="row-action-btn"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', color: selectedItem.isPublicToDepartment ? "var(--danger)" : "var(--accent-primary)" }}
                        >
                          {selectedItem.isPublicToDepartment ? 'Hide' : 'Publish'}
                        </button>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Calendar size={14} color="var(--success)" />
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Created</p>
                        <p style={{ fontSize: '0.85rem' }}>{new Date(selectedItem.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '2rem', flexDirection: 'column' }}>
                    <button
                      onClick={(e) => handleDownloadFile(selectedItem._id, selectedItem.originalName, e)}
                      className="btn-primary"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', padding: '10px', fontSize: '0.85rem' }}
                    >
                      <Download size={14} /> Download File
                    </button>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      {user?.role !== 'student' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShareModal({ ...shareModal, isOpen: true, id: selectedItem._id, type: 'file', isPublic: selectedItem.isPublicToDepartment }); }}
                          className="glass-panel"
                          style={{ flex: 1, padding: '10px', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          title="Generate Share Link"
                        >
                          <Share2 size={16} />
                        </button>
                      )}
                      {(user?.role === 'faculty' || user?.role === 'staff') && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setNotifyModal({ isOpen: true, fileId: selectedItem._id, target: 'department' }); }}
                          className="glass-panel"
                          style={{ flex: 1, padding: '10px', color: 'var(--accent-primary)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          title="Send Email Notification"
                        >
                          <Mail size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeleteFile(selectedItem._id, e)}
                        className="glass-panel"
                        style={{ flex: 1, padding: '10px', color: 'var(--danger)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Delete File"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        {/* Modal */}
        <AnimatePresence>
          {showFolderModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel"
                style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}
              >
                <h3 style={{ marginBottom: '1.5rem' }}>New Folder</h3>
                <form onSubmit={handleCreateFolder}>
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Enter folder name..."
                    autoFocus
                    required
                  />

                  <div style={{ marginTop: '1.5rem' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} /> Assignment Deadline (Optional)
                    </p>
                    <input
                      type="date"
                      value={newFolderDeadline}
                      onChange={(e) => setNewFolderDeadline(e.target.value)}
                      style={{ background: 'var(--glass-bg-hover)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px', fontSize: '0.9rem' }}>Create</button>
                    <button type="button" onClick={() => setShowFolderModal(false)} className="glass-panel" style={{ flex: 1, color: '#ffffff', fontWeight: '600', padding: '14px', fontSize: '0.9rem' }}>Cancel</button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Share Settings Modal */}
        <AnimatePresence>
          {shareModal.isOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel"
                style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}
              >
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Share2 size={24} color="var(--accent-primary)" /> {shareModal.type === 'file' ? 'Secure Share Link' : 'Folder Sharing Options'}
                </h3>

                {shareModal.type === 'file' ? (
                  <>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Link Expiry</p>
                      <select
                        value={shareModal.expiresHours}
                        onChange={(e) => setShareModal({ ...shareModal, expiresHours: e.target.value })}
                      >
                        <option value="0">Never Expires</option>
                        <option value="1">1 Hour</option>
                        <option value="24">24 Hours</option>
                        <option value="168">7 Days</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Download Limit (Optional)</p>
                      <input
                        type="number"
                        value={shareModal.downloadLimit}
                        onChange={(e) => setShareModal({ ...shareModal, downloadLimit: e.target.value })}
                        placeholder="e.g. 5 (Leave empty for unlimited)"
                      />
                    </div>
                  </>
                ) : (
                  <div style={{ marginBottom: '2rem' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                      You can create a "Drop Folder" link to allow others (like students) to upload files directly into this folder.
                    </p>
                    <button
                      onClick={() => { handleCreateDropFolder(shareModal.id); setShareModal({ ...shareModal, isOpen: false }); }}
                      className="btn-primary"
                      style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      <Plus size={18} /> Create Drop Folder Link
                    </button>
                  </div>
                )}

                {(user?.role === 'faculty' || user?.role === 'staff') && (
                  <div style={{ marginBottom: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                      Campus Visibility: <span style={{ color: shareModal.isPublic ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 'bold' }}>{shareModal.isPublic ? 'Visible to Dept' : 'Private'}</span>
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {!shareModal.isPublic ? (
                        <button
                          onClick={async () => {
                            if (shareModal.type === 'file') {
                              await handleTogglePublish(shareModal.id);
                            } else {
                              await handleToggleFolderPublish(shareModal.id);
                            }
                            setShareModal({ ...shareModal, isOpen: false });
                          }}
                          className="btn-primary"
                          style={{ flex: 1, padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <Layout size={16} /> Publish to Dept
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            if (shareModal.type === 'file') {
                              await handleTogglePublish(shareModal.id);
                            } else {
                              await handleToggleFolderPublish(shareModal.id);
                            }
                            setShareModal({ ...shareModal, isOpen: false });
                          }}
                          className="glass-panel"
                          style={{ flex: 1, padding: '10px', fontSize: '0.85rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <X size={16} /> Hide from Dept
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                  {shareModal.type === 'file' && (
                    <button onClick={handleShareFile} className="btn-primary" style={{ flex: 1, padding: '14px', fontSize: '0.9rem' }}>
                      Generate & Copy Link
                    </button>
                  )}
                  <button
                    onClick={() => setShareModal({ ...shareModal, isOpen: false })}
                    className="glass-panel"
                    style={{ flex: 1, padding: '14px', color: '#ffffff', fontWeight: '600', fontSize: '0.9rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Notify Modal */}
        <AnimatePresence>
          {notifyModal.isOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel"
                style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}
              >
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Mail size={24} color="var(--accent-primary)" /> Email Notification
                </h3>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Send an email notification about this shared file.
                </p>

                <div style={{ marginBottom: '2rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Who do you want to notify?</p>
                  <select
                    value={notifyModal.target}
                    onChange={(e) => setNotifyModal({ ...notifyModal, target: e.target.value })}
                  >
                    <option value="department">Only {user?.department} Department</option>
                    <option value="all">Entire Campus (All Departments)</option>
                    {selectedItem && selectedItem.ownerId && (selectedItem.ownerId._id || selectedItem.ownerId) !== user?._id && (
                      <option value="owner">Document Owner / Student ({selectedItem.ownerId.name})</option>
                    )}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                  <button onClick={handleNotify} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', fontSize: '0.9rem' }}>
                    <Mail size={16} /> Send Email
                  </button>
                  <button onClick={() => setNotifyModal({ ...notifyModal, isOpen: false })} className="glass-panel" style={{ flex: 1, color: '#ffffff', fontWeight: '600', padding: '14px', fontSize: '0.9rem' }}>Cancel</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Account Modal */}
        <AnimatePresence>
          {deleteAccountModal.isOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-panel"
                style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}
              >
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <Trash2 size={32} color="var(--danger)" />
                </div>
                <h2 style={{ marginBottom: '1rem', textAlign: 'center' }}>Delete Account</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5', textAlign: 'center', fontSize: '0.9rem' }}>
                  This will permanently delete your account, files, and folders. Why are you leaving us?
                </p>

                <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Graduated / Leaving the institution', 'Privacy concerns', 'No longer need to use the platform', 'Other'].map(option => (
                    <div
                      key={option}
                      onClick={() => setDeleteAccountModal({ ...deleteAccountModal, reason: option })}
                      className="glass-panel"
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        border: deleteAccountModal.reason === option ? '1px solid var(--danger)' : '1px solid var(--glass-border)',
                        background: deleteAccountModal.reason === option ? 'rgba(239, 68, 68, 0.1)' : 'var(--glass-bg)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: deleteAccountModal.reason === option ? '5px solid var(--danger)' : '2px solid var(--text-secondary)',
                        transition: 'all 0.2s'
                      }}></div>
                      <span style={{ fontSize: '0.85rem', color: deleteAccountModal.reason === option ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {option}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setDeleteAccountModal({ isOpen: false, reason: '' })}
                    className="glass-panel"
                    style={{ flex: 1, padding: '12px', cursor: 'pointer', border: '1px solid var(--glass-border)', color: '#ffffff', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteAccount}
                    className="btn-primary"
                    disabled={!deleteAccountModal.reason}
                    style={{ flex: 1, padding: '12px', background: deleteAccountModal.reason ? 'var(--danger)' : 'var(--glass-border)', cursor: deleteAccountModal.reason ? 'pointer' : 'not-allowed' }}
                  >
                    Delete Forever
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>

      {/* Help Request Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel"
              style={{ maxWidth: '500px', width: '100%', padding: '2.5rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                  <HelpCircle color="var(--accent-primary)" /> Contact Administration
                </h3>
                <button onClick={() => setShowHelpModal(false)} style={{ background: 'transparent', color: 'var(--text-secondary)' }}>
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Need help? Have an issue with a student account or technical difficulties? Describe your request below.
              </p>

              <form onSubmit={handleHelpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Issue Type</label>
                  <select
                    value={helpRequest.type}
                    onChange={(e) => setHelpRequest({ ...helpRequest, type: e.target.value })}
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Technical Issue">Technical / Bug Issue</option>
                    <option value="Student Account Issue">Student Account Issue</option>
                    <option value="Feature Request">Feature Request</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Subject</label>
                  <input
                    type="text"
                    value={helpRequest.subject}
                    onChange={(e) => setHelpRequest({ ...helpRequest, subject: e.target.value })}
                    placeholder="Summary of the issue"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Detailed Message</label>
                  <textarea
                    value={helpRequest.message}
                    onChange={(e) => setHelpRequest({ ...helpRequest, message: e.target.value })}
                    placeholder="Please provide details about your request..."
                    required
                    style={{ minHeight: '120px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(false)}
                    className="glass-panel"
                    style={{ flex: 1, padding: '12px', color: '#ffffff', fontWeight: '600', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" style={{ flex: 2, padding: '12px' }}>Submit Request</button>
                </div>
              </form>
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
              style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', textAlign: 'center' }}
            >
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Trash2 size={32} color="var(--danger)" />
              </div>
              <h2 style={{ marginBottom: '1rem' }}>{confirmModal.title}</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.5' }}>{confirmModal.message}</p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="glass-panel"
                  style={{ flex: 1, padding: '12px', cursor: 'pointer', border: '1px solid var(--glass-border)', color: '#ffffff', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px', background: 'var(--danger)' }}
                >
                  Confirm
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

export default Dashboard;
// Force Vite Recompile
