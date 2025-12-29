import { useEffect, useState } from 'react';
import Header from '../shared/Header';
import { api } from '../../utils/api';
import { Calendar } from '../shared/Calendar';
import { Notifications } from '../shared/Notifications';
import {
  BookOpen,
  Users,
  Video,
  LogOut,
  Plus,
  Send,
  Award,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface TeacherDashboardProps {
  user: any;
  onLogout: () => void;
}

interface Assignment {
  id: string;
  batchId: string;
  title: string;
  description: string;
  dueDate: string;
  submissions: any[];
}

export function TeacherDashboard({ user, onLogout }: TeacherDashboardProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [batch, setBatch] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'assignments' | 'students' | 'class' | 'notifications'>('assignments');
  const [loading, setLoading] = useState(true);
  
  // New assignment form
  const [showNewAssignment, setShowNewAssignment] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: ''
  });

  // Notification form
  const [notificationMessage, setNotificationMessage] = useState('');

  // Grading
  const [gradingPoints, setGradingPoints] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadData();
  }, []);

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const themeHandler = (e: any) => {
      try { setIsDark(!!e?.detail?.isDark || document.documentElement.classList.contains('dark')); } catch { setIsDark(document.documentElement.classList.contains('dark')); }
    };
    window.addEventListener('theme-changed', themeHandler as EventListener);
    try { setIsDark(document.documentElement.classList.contains('dark')); } catch {}
    return () => window.removeEventListener('theme-changed', themeHandler as EventListener);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      try {
        const detailBatchId = e?.detail?.batchId;
        // If no batchId provided, reload generally
        if (!detailBatchId) {
          loadData();
          return;
        }
        // If the teacher's batch was updated, reload
        if (detailBatchId === batch?.id) {
          loadData();
        }
      } catch (err) {
        loadData();
      }
    };

    window.addEventListener('batch-updated', handler as EventListener);
    window.addEventListener('schedules-updated', handler as EventListener);
    window.addEventListener('users-updated', handler as EventListener);
    return () => {
      window.removeEventListener('batch-updated', handler as EventListener);
      window.removeEventListener('schedules-updated', handler as EventListener);
      window.removeEventListener('users-updated', handler as EventListener);
    };
  }, [batch?.id]);

  useEffect(() => {
    if (!selectedBatchId) return;
    const selected = batches.find(b => b.id === selectedBatchId);
    if (selected) {
      setBatch(selected);
      setLoading(true);
      loadBatchData(selected).finally(() => setLoading(false));
    }
  }, [selectedBatchId]);

  const loadData = async () => {
    try {
      // Get all batches for this teacher
      const batchesRes = await api.getBatches();
      const teacherBatches = (batchesRes.batches || []).filter((b: any) => b.teacherId === user.id);
      setBatches(teacherBatches || []);

      // prefer previously selected batch if it still exists, otherwise pick first
      const initialId = selectedBatchId && teacherBatches.some((b: any) => b.id === selectedBatchId)
        ? selectedBatchId
        : (teacherBatches[0]?.id || null);

      if (initialId) {
        setSelectedBatchId(initialId);
        const teacherBatch = teacherBatches.find((b: any) => b.id === initialId);
        setBatch(teacherBatch);
        await loadBatchData(teacherBatch);
      } else {
        setBatch(null);
        setAssignments([]);
        setStudents([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchData = async (teacherBatch: any) => {
    try {
      const [assignmentsRes, usersRes] = await Promise.all([
        api.getAssignments(teacherBatch.id),
        api.getUsers('student')
      ]);

      setAssignments(assignmentsRes.assignments || []);

      let batchStudents = (usersRes && usersRes.users) ? usersRes.users.filter((s: any) => s.batchId === teacherBatch.id) : [];

      if ((batchStudents.length === 0 || !batchStudents.some((s: any) => s.batchId === teacherBatch.id)) && teacherBatch.studentIds && teacherBatch.studentIds.length > 0) {
        const allUsersRes = await api.getUsers();
        const allUsers = (allUsersRes && allUsersRes.users) ? allUsersRes.users : [];
        batchStudents = teacherBatch.studentIds.map((id: string) => allUsers.find((u: any) => u.id === id)).filter(Boolean);
      }

      setStudents(batchStudents || []);
    } catch (err) {
      console.error('Failed to load batch data', err);
      setAssignments([]);
      setStudents([]);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!batch) {
      alert('No batch assigned');
      return;
    }

    try {
      await api.createAssignment({
        batchId: batch.id,
        title: newAssignment.title,
        description: newAssignment.description,
        dueDate: newAssignment.dueDate,
        createdBy: user.id
      });
      
      setNewAssignment({ title: '', description: '', dueDate: '' });
      setShowNewAssignment(false);
      loadData();
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert('Failed to create assignment');
    }
  };

  const handleGradeSubmission = async (assignmentId: string, studentId: string) => {
    const points = gradingPoints[`${assignmentId}-${studentId}`];
    
    if (points === undefined || points < 0) {
      alert('Please enter valid points');
      return;
    }

    try {
      await api.gradeAssignment(assignmentId, studentId, points);

      // Create a targeted notification for the student so they can see the update in their UI
      const assignment = assignments.find((a: any) => a.id === assignmentId);
      const assignmentTitle = assignment?.title || 'your assignment';

      try {
        await api.createNotification({
          senderId: user.id,
          senderName: user.name,
          targetRole: 'student',
          targetBatchId: batch?.id,
          targetUserId: studentId,
          message: `${user.name} assigned ${points} points for ${assignmentTitle}`,
          meta: { type: 'grade', assignmentId, points, studentId }
        });
      } catch (e) {
        console.warn('Failed to create per-user notification after grading', e);
      }

      // local event for this window to allow immediate UI updates
      try { window.dispatchEvent(new CustomEvent('assignment-graded', { detail: { assignmentId, studentId, points } })); } catch {}

      toast.success('Points assigned');
      loadData();
      // Clear the grading input
      setGradingPoints({ ...gradingPoints, [`${assignmentId}-${studentId}`]: 0 });
    } catch (error) {
      console.error('Failed to grade submission:', error);
      alert('Failed to grade submission');
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notificationMessage.trim()) return;

    try {
      await api.createNotification({
        senderId: user.id,
        senderName: user.name,
        targetRole: 'student',
        targetBatchId: batch?.id,
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-indigo-900/20'
        : 'bg-gradient-to-br from-purple-50 via-indigo-50 to-purple-100'
    }`}>
      <Header user={user} onLogout={onLogout} role="teacher" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`group relative overflow-hidden ${isDark ? 'bg-gray-800/60 hover:bg-gray-800/80' : 'bg-white hover:bg-purple-50/80'} p-6 rounded-2xl shadow-lg hover:shadow-2xl border border-purple-200/50 dark:border-purple-800/50 transition-all duration-500 backdrop-blur-sm hover:-translate-y-1`}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-purple-300' : 'text-purple-600'} font-medium transition-colors duration-300`}>Total Students</p>
                <p className={`text-4xl mt-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>{students.length}</p>
                <div className="mt-2 w-full bg-purple-200 dark:bg-purple-900/30 rounded-full h-1">
                  <div className="bg-purple-500 h-1 rounded-full transition-all duration-1000" style={{width: `${Math.min(students.length * 10, 100)}%`}}></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/40 dark:to-purple-800/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className={`group relative overflow-hidden ${isDark ? 'bg-gray-800/60 hover:bg-gray-800/80' : 'bg-white hover:bg-indigo-50/80'} p-6 rounded-2xl shadow-lg hover:shadow-2xl border border-indigo-200/50 dark:border-indigo-800/50 transition-all duration-500 backdrop-blur-sm hover:-translate-y-1`}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-indigo-300' : 'text-indigo-600'} font-medium transition-colors duration-300`}>Assignments</p>
                <p className={`text-4xl mt-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>{assignments.length}</p>
                <div className="mt-2 w-full bg-indigo-200 dark:bg-indigo-900/30 rounded-full h-1">
                  <div className="bg-indigo-500 h-1 rounded-full transition-all duration-1000" style={{width: `${Math.min(assignments.length * 15, 100)}%`}}></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                <BookOpen className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div className={`group relative overflow-hidden ${isDark ? 'bg-gray-800/60 hover:bg-gray-800/80' : 'bg-white hover:bg-yellow-50/80'} p-6 rounded-2xl shadow-lg hover:shadow-2xl border border-yellow-200/50 dark:border-yellow-800/50 transition-all duration-500 backdrop-blur-sm hover:-translate-y-1`}>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center justify-between">
              <div>
                <p className={`${isDark ? 'text-yellow-300' : 'text-yellow-600'} font-medium transition-colors duration-300`}>Batch</p>
                <div className="mt-2">
                  {batches.length > 1 ? (
                    <select
                      value={selectedBatchId || ''}
                      onChange={(e) => setSelectedBatchId(e.target.value || null)}
                      className="px-3 py-2 border rounded-lg bg-white"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className={`text-2xl mt-2 font-bold ${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-300`}>{batch?.name || 'Not Assigned'}</p>
                  )}
                </div>
                <div className="mt-2 w-full bg-yellow-200 dark:bg-yellow-900/30 rounded-full h-1">
                  <div className="bg-yellow-500 h-1 rounded-full transition-all duration-1000" style={{width: batch ? '100%' : '0%'}}></div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-md">
                <Award className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'assignments', label: 'Assignments', icon: BookOpen },
            { id: 'students', label: 'Students', icon: Users },
            { id: 'notifications', label: 'Send Notification', icon: Send },
            { id: 'class', label: 'Class', icon: Video }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg transform scale-105'
                  : isDark
                  ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-md'
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
            {activeTab === 'assignments' && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2>Assignments</h2>
                  <button
                    onClick={() => setShowNewAssignment(!showNewAssignment)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Assignment
                  </button>
                </div>

                {showNewAssignment && (
                  <form onSubmit={handleCreateAssignment} className="mb-6 p-4 border border-purple-200 rounded-lg bg-purple-50">
                    <h3 className="mb-4">Create New Assignment</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          value={newAssignment.title}
                          onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Description</label>
                        <textarea
                          value={newAssignment.description}
                          onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          rows={3}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 mb-2">Due Date</label>
                        <input
                          type="date"
                          value={newAssignment.dueDate}
                          onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                          Create
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNewAssignment(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="mb-2">{assignment.title}</h3>
                      <p className="text-gray-600 mb-2">{assignment.description}</p>
                      <p className="text-sm text-gray-500 mb-4">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                      
                      <div className="space-y-3">
                        <h4 className="text-sm">
                          Submissions ({assignment.submissions.length})
                        </h4>
                        {assignment.submissions.map((submission) => (
                          <div key={submission.studentId} className="p-3 bg-gray-50 rounded border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="mb-1">{submission.studentName}</p>
                                <a
                                  href={submission.projectLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-indigo-600 hover:underline"
                                >
                                  {submission.projectLink}
                                </a>
                              </div>
                              {submission.points !== null ? (
                                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full">
                                  <CheckCircle className="w-4 h-4" />
                                  {submission.points} pts
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Points"
                                    value={gradingPoints[`${assignment.id}-${submission.studentId}`] || ''}
                                    onChange={(e) =>
                                      setGradingPoints({
                                        ...gradingPoints,
                                        [`${assignment.id}-${submission.studentId}`]: parseInt(e.target.value) || 0
                                      })
                                    }
                                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                                  />
                                  <button
                                    onClick={() => handleGradeSubmission(assignment.id, submission.studentId)}
                                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                  >
                                    Grade
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {assignment.submissions.length === 0 && (
                          <p className="text-gray-500 text-sm">No submissions yet</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {assignments.length === 0 && (
                    <p className="text-center py-12 text-gray-500">
                      No assignments yet. Create one to get started!
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'students' && (
              <div className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>My Students</h2>
                
                <div className="space-y-3">
                  {students.map((student) => {
                    // Calculate total points for this student
                    const totalPoints = assignments.reduce((sum, assignment) => {
                      const submission = assignment.submissions.find(s => s.studentId === student.id);
                      return sum + (submission?.points || 0);
                    }, 0);

                    return (
                      <div key={student.id} className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="mb-1">{student.name}</p>
                          <p className="text-sm text-gray-600">Username: {student.username}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="w-5 h-5 text-yellow-500" />
                          <span className="text-xl">{totalPoints} pts</span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {students.length === 0 && (
                    <p className="text-center py-12 text-gray-500">
                      No students assigned to your batch yet
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="mb-6">Send Notification to Students</h2>
                
                <form onSubmit={handleSendNotification} className="space-y-4">
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
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Send to All Students in Batch
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'class' && (
              <div className={`${isDark ? 'bg-gray-800/50' : 'bg-white'} p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Class Session</h2>
                
                {batch?.meetLink ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-purple-50">
                      <p className="text-gray-700">Your class meeting:</p>
                    </div>
                    <div className="flex flex-col items-start gap-3">
                      <a
                        href={batch.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Open Google Meet in new tab
                      </a>
                      <p className="text-sm text-gray-600">If the link doesn't open, copy and paste this URL into a new tab:</p>
                      <a className="text-sm text-indigo-600 break-all" href={batch.meetLink}>{batch.meetLink}</a>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-12 text-gray-500">
                    No class link configured. Please contact admin.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Calendar batchId={batch?.id} isDark={isDark} />
            {/* UpcomingClass removed — Calendar shows upcoming classes already */}
            <Notifications role="teacher" batchId={batch?.id} isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  );
}
