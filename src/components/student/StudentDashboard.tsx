import { useEffect, useRef, useState } from 'react';
import Header from '../shared/Header';
import { api } from '../../utils/api';
import Confetti from '../ui/Confetti';
import { Calendar } from '../shared/Calendar';
import { Notifications } from '../shared/Notifications';
import { 
  BookOpen, 
  Award, 
  Video, 
  LogOut, 
  Moon, 
  Sun,
  Send,
  Trophy,
  Target
} from 'lucide-react';

interface StudentDashboardProps {
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

export function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [batch, setBatch] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(user.batchId || null);
  const [teacher, setTeacher] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'assignments' | 'scores' | 'class'>('assignments');
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submissionLink, setSubmissionLink] = useState<{ [key: string]: string }>({});
  const [gradePopup, setGradePopup] = useState<{ open: boolean; points?: number; title?: string }>({ open: false });
  const prevPointsRef = useRef<Record<string, number | null>>({});
  const firstLoadRef = useRef(true);
  const loadSeenGrades = () => {
    try {
      const raw = localStorage.getItem('seenGrades');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {} as Record<string, number | null>;
    }
  };
  const seenGradesRef = useRef<Record<string, number | null>>(loadSeenGrades());

  useEffect(() => {
    let t: any;
    let audioCtx: AudioContext | null = null;
    let stopFlag = false;

    // Play a short celebratory melody using WebAudio when popup opens
    const playCelebrate = async () => {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        audioCtx = new AudioCtx();
        const gain = audioCtx.createGain();
        gain.connect(audioCtx.destination);
        gain.gain.value = 0.001;

        const notes = [880, 988, 1175, 988]; // simple ascending melody
        let now = audioCtx.currentTime + 0.05;
        for (let i = 0; i < notes.length && !stopFlag; i++) {
          const o = audioCtx.createOscillator();
          o.type = 'sine';
          o.frequency.value = notes[i];
          o.connect(gain);
          o.start(now + i * 0.12);
          o.stop(now + i * 0.12 + 0.18);
        }
        // Ramp volume to pleasant level then down
        gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.08);
        gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
      } catch (e) {
        // ignore audio errors
      }
    };

    if (gradePopup.open) {
      // Play sound once when popup opens
      playCelebrate();
      // Keep popup visible for 20 seconds
      t = setTimeout(() => setGradePopup({ open: false }), 20000);
    }

    return () => {
      stopFlag = true;
      try { if (audioCtx) { audioCtx.close(); } } catch {}
      clearTimeout(t);
    };
  }, [gradePopup.open]);

  useEffect(() => {
    loadData();
  }, [selectedBatchId, user.id]);

  useEffect(() => {
    const handler = (e: any) => {
      try {
        const detailBatchId = e?.detail?.batchId;
        if (!detailBatchId || detailBatchId === selectedBatchId) {
          // reload batch and assignments
          loadData();
        }
      } catch (err) {
        loadData();
      }
    };

    window.addEventListener('batch-updated', handler as EventListener);
    window.addEventListener('schedules-updated', handler as EventListener);
    window.addEventListener('users-updated', handler as EventListener);
    const themeHandler = (e: any) => {
      try { setIsDark(!!e?.detail?.isDark || document.documentElement.classList.contains('dark')); } catch { setIsDark(document.documentElement.classList.contains('dark')); }
    };
    window.addEventListener('theme-changed', themeHandler as EventListener);
    // initialize
    try { setIsDark(document.documentElement.classList.contains('dark')); } catch {}

    return () => {
      window.removeEventListener('batch-updated', handler as EventListener);
      window.removeEventListener('schedules-updated', handler as EventListener);
      window.removeEventListener('users-updated', handler as EventListener);
      window.removeEventListener('theme-changed', themeHandler as EventListener);
    };
  }, [selectedBatchId]);

  const loadData = async () => {
    try {
      // Fetch all batches and determine which batches the student belongs to
      const batchesRes = await api.getBatches();
      const allBatches = batchesRes.batches || [];
      const studentBatches = allBatches.filter((b: any) => (b.studentIds || []).includes(user.id));
      setBatches(studentBatches || []);

      // Determine active batch id (preference: selectedBatchId -> user.batchId -> first student batch)
      const activeId = selectedBatchId && studentBatches.some((b: any) => b.id === selectedBatchId)
        ? selectedBatchId
        : (user.batchId || (studentBatches[0] && studentBatches[0].id) || null);

      if (activeId) {
        const [assignmentsRes, batchRes] = await Promise.all([
          api.getAssignments(activeId),
          api.getBatch(activeId)
        ]);
        const newAssignments = assignmentsRes.assignments || [];

        // Compare with previous points and show popup on increase.
        // On first app load for this session, compare against persisted `seenGrades` so
        // students see celebrations for newly-graded items they haven't acknowledged yet.
        if (!firstLoadRef.current) {
          for (const a of newAssignments) {
            const mySub = a.submissions.find((s: any) => s.studentId === user.id);
            const prev = Object.prototype.hasOwnProperty.call(prevPointsRef.current, a.id)
              ? prevPointsRef.current[a.id]
              : null;
            const now = mySub?.points ?? null;
            if (prev !== null && now !== null && now > (prev as number)) {
              setGradePopup({ open: true, points: now, title: a.title });
              // mark as seen for this points value so it won't re-fire
              try {
                seenGradesRef.current[a.id] = now;
                localStorage.setItem('seenGrades', JSON.stringify(seenGradesRef.current));
              } catch (e) {}
              break;
            }
          }
        } else {
          for (const a of newAssignments) {
            const mySub = a.submissions.find((s: any) => s.studentId === user.id);
            const now = mySub?.points ?? null;
            const seen = Object.prototype.hasOwnProperty.call(seenGradesRef.current, a.id)
              ? seenGradesRef.current[a.id]
              : null;
            if (now !== null && seen !== now) {
              setGradePopup({ open: true, points: now, title: a.title });
              try {
                seenGradesRef.current[a.id] = now;
                localStorage.setItem('seenGrades', JSON.stringify(seenGradesRef.current));
              } catch (e) {}
              break;
            }
          }
        }

        // update prevPointsRef for next comparison
        for (const a of newAssignments) {
          const mySub = a.submissions.find((s: any) => s.studentId === user.id);
          prevPointsRef.current[a.id] = mySub?.points ?? null;
        }

        firstLoadRef.current = false;

        setAssignments(newAssignments);
        setBatch(batchRes.batch);

        // fetch teacher info for this batch (if available)
        try {
          const teachersRes = await api.getUsers('teacher');
          const allTeachers = (teachersRes && teachersRes.users) ? teachersRes.users : [];
          const t = allTeachers.find((u: any) => u.id === batchRes.batch.teacherId);
          setTeacher(t || null);
        } catch (e) {
          setTeacher(null);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for local assignment-graded events (this won't cross browser sessions)
    const handler = (e: any) => {
      try {
        const { assignmentId, studentId, points } = e?.detail || {};
        if (!assignmentId) return;
        if (studentId === user.id) {
          // show popup and mark this grade as seen so it won't re-fire
          const assignment = assignments.find(a => a.id === assignmentId);
          setGradePopup({ open: true, points, title: assignment?.title || 'Assignment' });
          try {
            seenGradesRef.current[assignmentId] = points ?? null;
            localStorage.setItem('seenGrades', JSON.stringify(seenGradesRef.current));
          } catch (e) {}
        }
        // reload data to update local view
        loadData();
      } catch (err) { console.error(err); }
    };
    window.addEventListener('assignment-graded', handler as EventListener);
    return () => window.removeEventListener('assignment-graded', handler as EventListener);
  }, [assignments, user.id]);

  const handleSubmitAssignment = async (assignmentId: string) => {
    const link = submissionLink[assignmentId];
    if (!link) return;

    try {
      await api.submitAssignment(assignmentId, user.id, link, user.name);
      setSubmissionLink({ ...submissionLink, [assignmentId]: '' });
      loadData();
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      alert('Failed to submit assignment');
    }
  };

  const getMySubmission = (assignment: Assignment) => {
    return assignment.submissions.find(s => s.studentId === user.id);
  };

  const totalPoints = assignments.reduce((sum, assignment) => {
    const submission = getMySubmission(assignment);
    return sum + (submission?.points || 0);
  }, 0);

  // (No global total-points watcher — celebration is triggered on assignment-level increases only)

  const bgClass = isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-100';
  const cardClass = isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const textClass = isDark ? 'text-gray-300' : 'text-gray-600';

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className={`mt-4 ${textClass}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDark
        ? 'bg-gradient-to-br from-gray-900 via-green-900/20 to-blue-900/20'
        : 'bg-gradient-to-br from-green-50 via-blue-50 to-green-100'
    }`}>
      <Header user={user} onLogout={onLogout} role="student" />

      {/* Grade popup with confetti */}
      {gradePopup.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`pointer-events-auto rounded-xl p-6 shadow-2xl transform transition-all ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <h3 className="text-xl font-bold">Great — you got {gradePopup.points} pts!</h3>
            {gradePopup.title && <p className="text-sm mt-1">for "{gradePopup.title}"</p>}
          </div>
          <Confetti />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`${cardClass} p-6 rounded-xl shadow-lg transition-colors duration-300`}> 
            <div className="flex items-center justify-between">
              <div>
                <p className={textClass}>Total Points</p>
                <p className="text-3xl mt-1">{totalPoints}</p>
              </div>
              <Trophy className="w-12 h-12 text-yellow-500" />
            </div>
          </div>
          
          <div className={`${cardClass} p-6 rounded-xl shadow-lg transition-colors duration-300`}> 
            <div className="flex items-center justify-between">
              <div>
                <p className={textClass}>Assignments</p>
                <p className="text-3xl mt-1">{assignments.length}</p>
              </div>
              <Target className="w-12 h-12 text-indigo-500" />
            </div>
          </div>
          
          <div className={`${cardClass} p-6 rounded-xl shadow-lg transition-colors duration-300`}> 
            <div className="flex items-center justify-between">
              <div>
                <p className={textClass}>Batch</p>
                <div className="mt-1">
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
                    <p className="text-xl mt-1">{batch?.name || 'Not Assigned'}</p>
                  )}
                </div>
                {teacher && (
                  <p className={`text-sm mt-1 ${textClass}`}>Teacher: {teacher.name}</p>
                )}
              </div>
              <BookOpen className="w-12 h-12 text-green-500" />
            </div>
          </div>
          
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'assignments', label: 'Assignments', icon: BookOpen },
            { id: 'scores', label: 'My Scores', icon: Award },
            { id: 'class', label: 'Join Class', icon: Video }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : isDark
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
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
              <div className={`relative overflow-hidden ${isDark ? 'bg-gray-800/60' : 'bg-white'} p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50`}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="mb-8">
                    <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Active Assignments</h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Complete your assignments and track your progress</p>
                  </div>

                  {assignments.length === 0 ? (
                    <div className="text-center py-16">
                      <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                      <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No assignments yet</p>
                      <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Check back later for new assignments from your teacher</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {assignments.map((assignment) => {
                        const submission = getMySubmission(assignment);
                        const isOverdue = new Date(assignment.dueDate) < new Date() && !submission;
                        const daysLeft = Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                        return (
                          <div
                            key={assignment.id}
                            className={`group relative overflow-hidden p-6 rounded-2xl border transition-all duration-500 hover:shadow-xl ${
                              isDark
                                ? 'border-gray-700 bg-gray-700/50 hover:bg-gray-700'
                                : 'border-gray-200 bg-white hover:bg-gray-50'
                            } ${isOverdue ? 'ring-2 ring-red-500/50' : ''}`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{assignment.title}</h3>
                                  <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{assignment.description}</p>
                                  <div className="flex items-center gap-4 text-sm">
                                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                      <Target className="w-4 h-4" />
                                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                      {daysLeft > 0 && ` (${daysLeft} days left)`}
                                      {isOverdue && ' (Overdue)'}
                                    </span>
                                  </div>
                                </div>
                                {submission && submission.points != null && (
                                  <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full font-semibold shadow-md">
                                    <Award className="w-5 h-5" />
                                    {submission.points} pts
                                  </div>
                                )}
                              </div>

                              {submission ? (
                                <div className={`p-4 rounded-xl border-2 ${
                                  submission.points !== null
                                    ? 'border-green-500/50 bg-green-500/10'
                                    : 'border-yellow-500/50 bg-yellow-500/10'
                                }`}>
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      submission.points !== null ? 'bg-green-500' : 'bg-yellow-500'
                                    }`}></div>
                                    <p className={`font-medium ${
                                      submission.points !== null
                                        ? 'text-green-700 dark:text-green-300'
                                        : 'text-yellow-700 dark:text-yellow-300'
                                    }`}>
                                      {submission.points !== null ? 'Graded' : 'Submitted - Waiting for grade'}
                                    </p>
                                  </div>
                                  <a
                                    href={submission.projectLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:underline transition-colors"
                                  >
                                    <Send className="w-4 h-4" />
                                    View Submission
                                  </a>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                    <span className="font-medium">Not submitted yet</span>
                                  </div>
                                  <div className="flex gap-3">
                                    <input
                                      type="url"
                                      placeholder="Enter your project link (GitHub, Replit, etc.)"
                                      value={submissionLink[assignment.id] || ''}
                                      onChange={(e) =>
                                        setSubmissionLink({
                                          ...submissionLink,
                                          [assignment.id]: e.target.value
                                        })
                                      }
                                      className={`flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 ${
                                        isDark
                                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                                          : 'bg-white border-gray-300 text-gray-900'
                                      }`}
                                    />
                                    <button
                                      onClick={() => handleSubmitAssignment(assignment.id)}
                                      disabled={!submissionLink[assignment.id]}
                                      className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-lg transform hover:scale-105 disabled:transform-none font-medium"
                                    >
                                      <Send className="w-5 h-5" />
                                      Submit
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'scores' && (
              <div className={`${cardClass} p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>My Scores</h2>
                
                <div className="space-y-4">
                  {assignments
                    .filter(a => getMySubmission(a)?.points != null)
                    .map((assignment) => {
                      const submission = getMySubmission(assignment);
                      return (
                        <div
                          key={assignment.id}
                          className={`p-4 rounded-lg border ${
                            isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200'
                          } flex items-center justify-between`}
                        >
                          <div>
                            <h3 className="mb-1">{assignment.title}</h3>
                              <p className={`text-sm ${textClass}`}>
                                Submitted: {submission ? new Date(submission.submittedAt).toLocaleDateString() : '—'}
                              </p>
                          </div>
                          <div className="flex items-center gap-2 text-2xl">
                            <Award className="w-8 h-8 text-yellow-500" />
                            {submission.points}
                          </div>
                        </div>
                      );
                    })}
                  
                  {assignments.filter(a => getMySubmission(a)?.points !== null).length === 0 && (
                    <p className={`text-center py-12 ${textClass}`}>
                      No graded assignments yet
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'class' && (
              <div className={`${cardClass} p-6 rounded-xl shadow-lg transition-colors duration-300`}>
                <h2 className="mb-6">Join Class</h2>
                
                {batch?.meetLink ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                      <p className={textClass}>Click below to join your class session:</p>
                    </div>
                    <div className="flex flex-col items-start gap-3">
                      <a
                        href={batch.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Open Google Meet in new tab
                      </a>
                      <p className={`text-sm ${textClass}`}>If the link doesn't open, copy and paste this URL into a new tab:</p>
                      <a className="text-sm text-indigo-600 break-all" href={batch.meetLink}>{batch.meetLink}</a>
                    </div>
                  </div>
                ) : (
                  <p className={`text-center py-12 ${textClass}`}>
                    No class link available. Please contact your teacher.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Calendar batchId={selectedBatchId || batch?.id} isDark={isDark} />
            {/* UpcomingClass removed — Calendar shows upcoming classes already */}
            <Notifications role="student" batchId={selectedBatchId || batch?.id} userId={user.id} isDark={isDark} />
          </div>
        </div>
      </div>
    </div>
  );
}
