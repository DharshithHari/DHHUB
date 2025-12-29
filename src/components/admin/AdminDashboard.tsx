import { useEffect, useState } from 'react';
import Header from '../shared/Header';
import { api } from '../../utils/api';
import { Calendar } from '../shared/Calendar';
import { Notifications } from '../shared/Notifications';
import { DemoDataSeeder } from './DemoDataSeeder';
import { BatchManagement } from './BatchManagement';
import {
  BookOpen,
  Users,
  Calendar as CalendarIcon,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Send,
  UserPlus,
  Shield,
  Loader2
} from 'lucide-react';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [batches, setBatches] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'batches' | 'users' | 'schedules' | 'notifications'>('batches');
  const [loading, setLoading] = useState(true);
  const [showDemoSeeder, setShowDemoSeeder] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Forms
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'student', name: '', batchId: '' });
  
  // Batch creation / editing state (was missing)
  const [showNewBatch, setShowNewBatch] = useState(false);
  const [newBatch, setNewBatch] = useState({ name: '', teacherId: '', meetLink: '' });
  const [editingBatch, setEditingBatch] = useState<any | null>(null);

  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ batchId: '', date: '', time: '', title: '' });
  
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTarget, setNotificationTarget] = useState<'all' | 'teacher'>('all');

  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const themeHandler = (e: any) => {
      try { setIsDark(!!e?.detail?.isDark || document.documentElement.classList.contains('dark')); } catch { setIsDark(document.documentElement.classList.contains('dark')); }
    };
    window.addEventListener('theme-changed', themeHandler as EventListener);
    try { setIsDark(document.documentElement.classList.contains('dark')); } catch {}
    return () => window.removeEventListener('theme-changed', themeHandler as EventListener);
  }, []);

  // Enforce permanent dark mode while admin dashboard is mounted
  useEffect(() => {
    const root = document.documentElement;
    const prevWasDark = root.classList.contains('dark');
    try {
      root.classList.add('dark');
      try { localStorage.setItem('theme', 'dark'); } catch {}
      try { window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark: true } })); } catch {}
    } catch (e) {}

    return () => {
      try {
        if (!prevWasDark) {
          root.classList.remove('dark');
          try { localStorage.setItem('theme', 'light'); } catch {}
          try { window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark: false } })); } catch {}
        }
      } catch (e) {}
    };
  }, []);

  const loadData = async () => {
    try {
      const [batchesRes, teachersRes, studentsRes, schedulesRes] = await Promise.all([
        api.getBatches(),
        api.getUsers('teacher'),
        api.getUsers('student'),
        api.getSchedules()
      ]);
      
      setBatches(batchesRes.batches || []);
      setTeachers(teachersRes.users || []);
      setStudents(studentsRes.users || []);
      setSchedules(schedulesRes.schedules || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createBatch(newBatch);
      setNewBatch({ name: '', teacherId: '', meetLink: '' });
      setShowNewBatch(false);
      loadData();
    } catch (error) {
      console.error('Failed to create batch:', error);
      alert('Failed to create batch');
    }
  };

  const handleUpdateBatch = async (batchId: string, updates: any) => {
    try {
      await api.updateBatch(batchId, updates);
      setEditingBatch(null);
      loadData();
      try {
        window.dispatchEvent(new CustomEvent('batch-updated', { detail: { batchId } }));
      } catch (e) {
        // ignore in non-browser env
      }
    } catch (error) {
      console.error('Failed to update batch:', error);
      alert('Failed to update batch');
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    
    try {
      await api.deleteBatch(batchId);
      loadData();
    } catch (error) {
      console.error('Failed to delete batch:', error);
      alert('Failed to delete batch');
    }
  };

  const handleAddStudentToBatch = async (batchId: string, studentId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    try {
      const updatedStudentIds = [...(batch.studentIds || []), studentId];
      await api.updateBatch(batchId, { studentIds: updatedStudentIds });
      
      // Update student's batchId
      await api.updateUser(studentId, { batchId });
      
      loadData();
      try { window.dispatchEvent(new CustomEvent('batch-updated', { detail: { batchId } })); } catch {};
      try { window.dispatchEvent(new CustomEvent('users-updated', { detail: { userId: studentId } })); } catch {};
    } catch (error) {
      console.error('Failed to add student to batch:', error);
      alert('Failed to add student to batch');
    }
  };

  const handleRemoveStudentFromBatch = async (batchId: string, studentId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    try {
      const updatedStudentIds = (batch.studentIds || []).filter((id: string) => id !== studentId);
      await api.updateBatch(batchId, { studentIds: updatedStudentIds });
      
      // Remove student's batchId
      await api.updateUser(studentId, { batchId: null });
      
      loadData();
      try { window.dispatchEvent(new CustomEvent('batch-updated', { detail: { batchId } })); } catch {};
      try { window.dispatchEvent(new CustomEvent('users-updated', { detail: { userId: studentId } })); } catch {};
    } catch (error) {
      console.error('Failed to remove student from batch:', error);
      alert('Failed to remove student from batch');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      setNewUser({ username: '', password: '', role: 'student', name: '', batchId: '' });
      setShowNewUser(false);
      loadData();
      try { window.dispatchEvent(new CustomEvent('users-updated')); } catch {};
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await api.deleteUser(userId);
      loadData();
      try { window.dispatchEvent(new CustomEvent('users-updated', { detail: { userId } })); } catch {};
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleEditUser = (user: any) => {
    setEditingUser({ ...user });
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      await api.updateUser(userId, updates);
      setEditingUser(null);
      loadData();
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createSchedule(newSchedule);
      setNewSchedule({ batchId: '', date: '', time: '', title: '' });
      setShowNewSchedule(false);
      loadData();
      try {
        window.dispatchEvent(new CustomEvent('schedules-updated', { detail: { batchId: newSchedule.batchId } }));
      } catch (e) {
        // ignore in non-browser env
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
      alert('Failed to create schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    
    try {
      await api.deleteSchedule(scheduleId);
      loadData();
      try {
        window.dispatchEvent(new CustomEvent('schedules-updated'));
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
      alert('Failed to delete schedule');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notificationMessage.trim()) return;

    try {
      await api.createNotification({
        senderId: user.id,
        senderName: user.name,
        targetRole: notificationTarget,
        message: notificationMessage
      });
      
      setNotificationMessage('');
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification');
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} flex items-center justify-center transition-colors duration-300`}>
        <div className="text-center">
          <Loader2 className={`animate-spin h-12 w-12 mx-auto ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <p className={`mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-blue-900/20 to-indigo-900/20'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100'
    }`}>
      {/* Header */}
      {/* Shared header */}
      <Header user={user} onLogout={onLogout} role="admin" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className={`group relative overflow-hidden ${isDark ? 'bg-gray-800/60 hover:bg-gray-800/80' : 'bg-white hover:bg-blue-50/80'} p-6 rounded-2xl shadow-lg hover:shadow-2xl border border-blue-200/50 dark:border-blue-800/50 transition-all duration-500 backdrop-blur-sm hover:-translate-y-1`}>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-blue-300' : 'text-blue-600'} font-medium transition-colors duration-300`}>Total Batches</p>
                <p className={`text-4xl mt-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>{batches.length}</p>
                <div className="mt-2 w-full bg-blue-200 dark:bg-blue-900/30 rounded-full h-1">
                  <div className="bg-blue-500 h-1 rounded-full transition-all duration-1000" style={{width: `${Math.min(batches.length * 10, 100)}%`}}></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className={`group relative overflow-hidden ${isDark ? 'bg-gray-800/60 hover:bg-gray-800/80' : 'bg-white hover:bg-purple-50/80'} p-6 rounded-2xl shadow-lg hover:shadow-2xl border border-purple-200/50 dark:border-purple-800/50 transition-all duration-500 backdrop-blur-sm hover:-translate-y-1`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-purple-300' : 'text-purple-600'} font-medium transition-colors duration-300`}>Teachers</p>
                <p className={`text-4xl mt-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>{teachers.length}</p>
                <div className="mt-2 w-full bg-purple-200 dark:bg-purple-900/30 rounded-full h-1">
                  <div className="bg-purple-500 h-1 rounded-full transition-all duration-1000" style={{width: `${Math.min(teachers.length * 20, 100)}%`}}></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className={`group relative overflow-hidden ${isDark ? 'bg-gray-800/60 hover:bg-gray-800/80' : 'bg-white hover:bg-green-50/80'} p-6 rounded-2xl shadow-lg hover:shadow-2xl border border-green-200/50 dark:border-green-800/50 transition-all duration-500 backdrop-blur-sm hover:-translate-y-1`}>
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-green-300' : 'text-green-600'} font-medium transition-colors duration-300`}>Students</p>
                <p className={`text-4xl mt-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>{students.length}</p>
                <div className="mt-2 w-full bg-green-200 dark:bg-green-900/30 rounded-full h-1">
                  <div className="bg-green-500 h-1 rounded-full transition-all duration-1000" style={{width: `${Math.min(students.length * 5, 100)}%`}}></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                <Users className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className={`group relative overflow-hidden ${isDark ? 'bg-gray-800/60 hover:bg-gray-800/80' : 'bg-white hover:bg-orange-50/80'} p-6 rounded-2xl shadow-lg hover:shadow-2xl border border-orange-200/50 dark:border-orange-800/50 transition-all duration-500 backdrop-blur-sm hover:-translate-y-1`}>
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-orange-300' : 'text-orange-600'} font-medium transition-colors duration-300`}>Schedules</p>
                <p className={`text-4xl mt-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>{schedules.length}</p>
                <div className="mt-2 w-full bg-orange-200 dark:bg-orange-900/30 rounded-full h-1">
                  <div className="bg-orange-500 h-1 rounded-full transition-all duration-1000" style={{width: `${Math.min(schedules.length * 15, 100)}%`}}></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                <CalendarIcon className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'batches', label: 'Batches', icon: BookOpen },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'schedules', label: 'Schedules', icon: CalendarIcon },
            { id: 'notifications', label: 'Notifications', icon: Send }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : `${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'batches' && (
              <div className={`relative overflow-hidden ${isDark ? 'bg-gray-800/60' : 'bg-white'} p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50`}>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Batch Management</h2>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Manage your class batches and assignments</p>
                    </div>
                    <button
                      onClick={() => setShowNewBatch(!showNewBatch)}
                      className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-2xl hover:from-indigo-600 hover:to-indigo-700 hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 shadow-lg"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="font-medium">New Batch</span>
                    </button>
                  </div>

                {showNewBatch && (
                  <form onSubmit={handleCreateBatch} className="mb-6 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                    <h3 className="mb-4">Create New Batch</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Batch Name</label>
                        <input
                          type="text"
                          value={newBatch.name}
                          onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Assign Teacher</label>
                        <select
                          value={newBatch.teacherId}
                          onChange={(e) => setNewBatch({ ...newBatch, teacherId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="">No teacher assigned</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.username})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Google Meet Link</label>
                        <input
                          type="url"
                          value={newBatch.meetLink}
                          onChange={(e) => setNewBatch({ ...newBatch, meetLink: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="https://meet.google.com/..."
                        />
                      </div>
                      <div className="flex gap-2">
                                <button type="submit" className={`px-4 py-2 ${isDark ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'} rounded-lg`}>
                                  Create
                                </button>
                                <button type="button" onClick={() => setShowNewBatch(false)} className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'} rounded-lg`}>
                                  Cancel
                                </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {batches.map((batch) => (
                    <div key={batch.id} className={`p-4 border rounded-lg transition-all duration-300 hover:shadow-md ${
                      isDark
                        ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}>
                      {editingBatch?.id === batch.id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editingBatch.name}
                            onChange={(e) => setEditingBatch({ ...editingBatch, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                          <select
                            value={editingBatch.teacherId || ''}
                            onChange={(e) => setEditingBatch({ ...editingBatch, teacherId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          >
                            <option value="">No teacher</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <input
                            type="url"
                            value={editingBatch.meetLink || ''}
                            onChange={(e) => setEditingBatch({ ...editingBatch, meetLink: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                            placeholder="Google Meet link"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateBatch(batch.id, editingBatch)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingBatch(null)}
                              className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="mb-1">{batch.name}</h3>
                              <p className="text-sm text-gray-600">
                                Teacher: {teachers.find(t => t.id === batch.teacherId)?.name || 'Not assigned'}
                              </p>
                              {batch.meetLink && (
                                <p className="text-sm text-indigo-600 mt-1">
                                  <a href={batch.meetLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    Meet Link
                                  </a>
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingBatch(batch)}
                                className={`p-2 rounded ${isDark ? 'text-indigo-300 hover:bg-indigo-700/20' : 'text-indigo-600 hover:bg-indigo-50'}`}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteBatch(batch.id)}
                                className={`p-2 rounded ${isDark ? 'text-red-400 hover:bg-red-700/10' : 'text-red-600 hover:bg-red-50'}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm mb-2">Students ({batch.studentIds?.length || 0}):</p>
                            <div className="space-y-2 mb-3">
                              {students.filter(s => batch.studentIds?.includes(s.id)).map(student => (
                                <div
                                  key={student.id}
                                  className={`flex items-center justify-between px-3 py-2 rounded ${isDark ? 'bg-gray-700/40 text-gray-100' : 'bg-gray-50 text-gray-900'}`}
                                >
                                  <span className="text-sm">{student.name}</span>
                                  <button
                                    onClick={() => handleRemoveStudentFromBatch(batch.id, student.id)}
                                    className={`${isDark ? 'text-red-300 hover:text-red-100' : 'text-red-600 hover:text-red-800'}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAddStudentToBatch(batch.id, e.target.value);
                                  e.target.value = '';
                                }
                              }}
                              className={`w-full px-3 py-2 border rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                            >
                              <option value="">Add student...</option>
                              {students.filter(s => !batch.studentIds?.includes(s.id)).map(student => (
                                <option key={student.id} value={student.id}>{student.name} ({student.username})</option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  
                  {batches.length === 0 && (
                    <p className="text-center py-12 text-gray-500">
                      No batches yet. Create one to get started!
                    </p>
                  )}
                </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
                  <div className={`${isDark ? 'bg-gray-800/60' : 'bg-white'} p-6 rounded-xl shadow-lg`}>
                <div className="flex items-center justify-between mb-6">
                  <h2>User Management</h2>
                  <button
                    onClick={() => setShowNewUser(!showNewUser)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                  >
                    <UserPlus className="w-4 h-4" />
                    New User
                  </button>
                </div>

                {showNewUser && (
                  <form onSubmit={handleCreateUser} className="mb-6 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                    <h3 className="mb-4">Create New User</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Role</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Name</label>
                        <input
                          type="text"
                          value={newUser.name}
                          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Username</label>
                        <input
                          type="text"
                          value={newUser.username}
                          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Password</label>
                        <input
                          type="text"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      {newUser.role === 'student' && (
                        <div>
                          <label className="block text-gray-700 mb-2">Assign to Batch</label>
                          <select
                            value={newUser.batchId}
                            onChange={(e) => setNewUser({ ...newUser, batchId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">No batch</option>
                            {batches.map(b => (
                              <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button type="submit" className={`px-4 py-2 ${isDark ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'} rounded-lg`}>
                          Create
                        </button>
                        <button type="button" onClick={() => setShowNewUser(false)} className={`px-4 py-2 ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'} rounded-lg`}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3">Teachers ({teachers.length})</h3>
                    <div className="space-y-2">
                      {teachers.map(teacher => (
                        <div key={teacher.id} className={`p-3 border rounded-lg ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`}>
                          {editingUser?.id === teacher.id ? (
                            <div className="space-y-2">
                              <input
                                className="w-full px-3 py-2 border rounded"
                                value={editingUser.name}
                                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                              />
                              <input
                                className="w-full px-3 py-2 border rounded"
                                value={editingUser.username}
                                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateUser(teacher.id, { name: editingUser.name, username: editingUser.username })}
                                  className={`px-3 py-1 rounded ${isDark ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingUser(null)}
                                  className={`px-3 py-1 rounded ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'}`}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <p>{teacher.name}</p>
                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>@{teacher.username}</p>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Password: <span className="font-mono">{teacher.password || '—'}</span></p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditUser(teacher)}
                                  className={`p-2 rounded ${isDark ? 'text-indigo-300 hover:bg-indigo-700/20' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(teacher.id)}
                                  className={`p-2 rounded ${isDark ? 'text-red-400 hover:bg-red-700/10' : 'text-red-600 hover:bg-red-50'}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {teachers.length === 0 && (
                        <p className="text-gray-500 text-sm">No teachers yet</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-3">Students ({students.length})</h3>
                    <div className="space-y-2">
                        {students.map(student => (
                          <div key={student.id} className={`p-3 border rounded-lg ${isDark ? 'border-gray-700 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`}>
                            {editingUser?.id === student.id ? (
                            <div className="space-y-2">
                              <input
                                className="w-full px-3 py-2 border rounded"
                                value={editingUser.name}
                                onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                              />
                              <input
                                className="w-full px-3 py-2 border rounded"
                                value={editingUser.username}
                                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                              />
                              <select
                                className="w-full px-3 py-2 border rounded"
                                value={editingUser.batchId || ''}
                                onChange={(e) => setEditingUser({ ...editingUser, batchId: e.target.value || null })}
                              >
                                <option value="">No batch</option>
                                {batches.map(b => (
                                  <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleUpdateUser(student.id, { name: editingUser.name, username: editingUser.username, batchId: editingUser.batchId })}
                                  className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingUser(null)}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <p>{student.name}</p>
                                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                  @{student.username}
                                  {student.batchId && ` • ${batches.find(b => b.id === student.batchId)?.name}`}
                                </p>
                                {/* Show password in admin view as requested */}
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Password: <span className="font-mono">{student.password || '—'}</span></p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditUser(student)}
                                  className={`p-2 rounded ${isDark ? 'text-indigo-300 hover:bg-indigo-700/20' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(student.id)}
                                  className={`p-2 rounded ${isDark ? 'text-red-400 hover:bg-red-700/10' : 'text-red-600 hover:bg-red-50'}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {students.length === 0 && (
                        <p className="text-gray-500 text-sm">No students yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'schedules' && (
              <div className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm`}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Schedule Management</h2>
                  <button
                    onClick={() => setShowNewSchedule(!showNewSchedule)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-4 h-4" />
                    New Schedule
                  </button>
                </div>

                {showNewSchedule && (
                  <form onSubmit={handleCreateSchedule} className="mb-6 p-4 border border-indigo-200 rounded-lg bg-indigo-50">
                    <h3 className="mb-4">Create New Schedule</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Batch</label>
                        <select
                          value={newSchedule.batchId}
                          onChange={(e) => setNewSchedule({ ...newSchedule, batchId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        >
                          <option value="">Select batch...</option>
                          {batches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          value={newSchedule.title}
                          onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="e.g., Python Basics"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Date</label>
                        <input
                          type="date"
                          value={newSchedule.date}
                          onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Time</label>
                        <input
                          type="time"
                          value={newSchedule.time}
                          onChange={(e) => setNewSchedule({ ...newSchedule, time: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                          Create
                        </button>
                        <button type="button" onClick={() => setShowNewSchedule(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {schedules.map(schedule => {
                    const batch = batches.find(b => b.id === schedule.batchId);
                    return (
                      <div key={schedule.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <h3 className="mb-1">{schedule.title}</h3>
                          <p className="text-sm text-gray-600">
                            {batch?.name} • {new Date(schedule.date).toLocaleDateString()} at {schedule.time}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                  
                  {schedules.length === 0 && (
                    <p className="text-center py-12 text-gray-500">
                      No schedules yet. Create one to get started!
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="mb-6">Send Notification</h2>
                
                <form onSubmit={handleSendNotification} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 mb-2">Send To</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="all"
                          checked={notificationTarget === 'all'}
                          onChange={(e) => setNotificationTarget(e.target.value as any)}
                          className="w-4 h-4"
                        />
                        Everyone
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          value="teacher"
                          checked={notificationTarget === 'teacher'}
                          onChange={(e) => setNotificationTarget(e.target.value as any)}
                          className="w-4 h-4"
                        />
                        Teachers Only
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 mb-2">Message</label>
                    <textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                      rows={6}
                      placeholder="Type your message here..."
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Send Notification
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {batches.length === 0 && teachers.length === 0 && students.length === 0 && (
              <DemoDataSeeder onComplete={() => loadData()} />
            )}
            <Calendar isDark={isDark} />
            {/* UpcomingClass removed — Calendar shows upcoming classes already */}
            <Notifications role="admin" isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  );
}