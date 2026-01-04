// Allow an explicit VITE_API_BASE to override function host (prod or dev).
let _import_meta: any;
if (typeof window !== 'undefined' && (window as any).__import_meta_fallback__) {
  _import_meta = (window as any).__import_meta_fallback__;
} else {
  try {
    // Access `import.meta` at runtime via a dynamic Function to avoid
    // parse-time TypeScript/TSX errors from `as` assertions.
    // eslint-disable-next-line no-new-func
    const getImportMeta = new Function('return (typeof import !== "undefined" && import.meta) ? import.meta : undefined');
    _import_meta = getImportMeta();
  } catch (e) {
    _import_meta = undefined;
  }
}
// Default to local fallback endpoint for the legacy server route.
const DEFAULT_BASE = `http://localhost:4000/functions/v1/make-server-f258bbc4`;
const LOCAL_FALLBACK = `http://localhost:4000/functions/v1/make-server-f258bbc4`;

// Allow explicit override via Vite env var VITE_API_BASE (set this when running dev to force localhost)
const envBase = _import_meta && _import_meta.env && _import_meta.env.VITE_API_BASE
  ? _import_meta.env.VITE_API_BASE
  : null;

const BASE_URL = envBase || ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? LOCAL_FALLBACK
  : DEFAULT_BASE);

// Firebase client helpers (used for client-side sign-in)
import { getFirebaseAuth } from './firebase.ts';
import { signInWithEmailAndPassword } from 'firebase/auth';

// If the developer sets `VITE_API_BASE=LOCAL_MOCK` we bypass network calls and
// use an in-browser mock implementation. This is useful when DNS/network to
// the real function host is unreliable during local development.
// Enable client mock when explicitly requested, or by default on localhost
// when no `VITE_API_BASE` override is provided. This prevents the client
// from attempting network calls to unreachable hosts during local dev.
const USE_CLIENT_MOCK = envBase === 'LOCAL_MOCK' || (typeof window !== 'undefined' && !envBase && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'));

// Simple in-client mock implementation for the minimal auth endpoints used
// during development. It stores a demo session id in localStorage so the
// rest of the app can continue using `getSessionId()`.
async function clientMockCall(endpoint: string, options: RequestInit = {}) {
  // Helper: persistent in-browser storage for mock data
  function readStore<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) as T : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeStore<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Initialize stores
  const users = readStore<any[]>('mock_users', [
    { id: 'admin:Dharshith24', username: 'Dharshith24', role: 'admin', name: 'Admin', batchId: null },
    { id: 'teacher:1', username: 'teacher1', role: 'teacher', name: 'Teacher One', batchId: null },
    { id: 'student:1', username: 'student1', role: 'student', name: 'Student One', batchId: 'batch:1' },
    { id: 'student:2', username: 'student2', role: 'student', name: 'Student Two', batchId: 'batch:1' },
    { id: 'student:3', username: 'student3', role: 'student', name: 'Student Three', batchId: 'batch:2' },
    { id: 'student:4', username: 'student4', role: 'student', name: 'Student Four', batchId: 'batch:2' }
  ]);
  const batches = readStore<any[]>('mock_batches', [
    { id: 'batch:1', name: 'Demo Batch', teacherId: 'teacher:1', studentIds: ['student:1','student:2'], meetLink: 'https://meet.google.com/demo' },
    { id: 'batch:2', name: 'Evening Batch', teacherId: 'teacher:1', studentIds: ['student:3','student:4'], meetLink: 'https://meet.google.com/evening' }
  ]);
  const schedules = readStore<any[]>('mock_schedules', []);
  const assignmentsStore = readStore<any[]>('mock_assignments', [
    { id: 'assign:1', batchId: 'batch:1', title: 'Welcome Project', description: 'Initial demo assignment', dueDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(), createdBy: 'teacher:1', submissions: [] },
    { id: 'assign:2', batchId: 'batch:2', title: 'Evening Intro', description: 'Assignment for evening batch', dueDate: new Date(Date.now() + 10*24*60*60*1000).toISOString(), createdBy: 'teacher:1', submissions: [] }
  ]);

  // parse query params if present
  const [path, q] = endpoint.split('?');
  const params = new URLSearchParams(q || '');

  // Auth: login
  if (path === '/auth/login' && options.method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
    const found = users.find(u => u.username === body.username && (u.password ? u.password === body.password : true));
    if (body.username === 'Dharshith24' && body.password === 'dharshith@hari24') {
      const sid = 'local-demo-session';
      setSessionId(sid);
      return { success: true, sessionId: sid, user: users.find(u => u.username === 'Dharshith24') };
    }
    if (found) {
      const sid = `local-${Date.now()}`;
      setSessionId(sid);
      return { success: true, sessionId: sid, user: found };
    }
    const err: any = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // Auth: session
  if (path === '/auth/session' && (!options.method || options.method === 'GET')) {
    const sid = getSessionId();
    if (sid) {
      // return first admin for demo
      const user = users.find(u => u.id === 'admin:Dharshith24') || users[0] || null;
      return { user };
    }
    const err: any = new Error('No session');
    err.status = 401;
    throw err;
  }

  // Users: create
  if (path === '/users' && options.method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
    const id = `user:${Date.now()}`;
    const newUser = { id, ...body };
    users.push(newUser);
    writeStore('mock_users', users);
    return { user: newUser };
  }

  // Users: list (supports role filter)
  if (path === '/users' && (!options.method || options.method === 'GET')) {
    const role = params.get('role');
    const filtered = role ? users.filter(u => u.role === role) : users;
    return { users: filtered };
  }

  // Users: update/delete by id
  if (path.startsWith('/users/') && (options.method === 'PUT' || options.method === 'DELETE')) {
    const id = path.replace('/users/', '');
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      const err: any = new Error('Not found'); err.status = 404; throw err;
    }
    if (options.method === 'DELETE') {
      users.splice(idx, 1);
      writeStore('mock_users', users);
      return { success: true };
    }
    // PUT
    const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
    users[idx] = { ...users[idx], ...body };
    writeStore('mock_users', users);
    return { user: users[idx] };
  }

  // Batches: create
  if (path === '/batches' && options.method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
    const id = `batch:${Date.now()}`;
    const newBatch = { id, ...body };
    batches.push(newBatch);
    writeStore('mock_batches', batches);
    return { batch: newBatch };
  }

  // Batches: list
  if (path === '/batches' && (!options.method || options.method === 'GET')) {
    return { batches };
  }

  // Batches: update/delete by id
  // Batches: get/update/delete by id
  if (path.startsWith('/batches/') && (!options.method || options.method === 'GET')) {
    const id = path.replace('/batches/', '');
    const found = batches.find(b => b.id === id);
    if (!found) { const err: any = new Error('Not found'); err.status = 404; throw err; }
    return { batch: found };
  }

  if (path.startsWith('/batches/') && (options.method === 'PUT' || options.method === 'DELETE')) {
    const id = path.replace('/batches/', '');
    const idx = batches.findIndex(b => b.id === id);
    if (idx === -1) { const err: any = new Error('Not found'); err.status = 404; throw err; }
    if (options.method === 'DELETE') {
      batches.splice(idx, 1);
      writeStore('mock_batches', batches);
      return { success: true };
    }
    const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
    batches[idx] = { ...batches[idx], ...body };
    writeStore('mock_batches', batches);
    return { batch: batches[idx] };
  }

  // Schedules: create
  if (path === '/schedules' && options.method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
    const id = `schedule:${Date.now()}`;
    const newSched = { id, ...body };
    schedules.push(newSched);
    writeStore('mock_schedules', schedules);
    return { schedule: newSched };
  }

  // Schedules: list (supports batchId filter)
  if (path === '/schedules' && (!options.method || options.method === 'GET')) {
    const batchId = params.get('batchId');
    const filtered = batchId ? schedules.filter(s => s.batchId === batchId) : schedules;
    return { schedules: filtered };
  }

  // Schedules: update/delete by id
  if (path.startsWith('/schedules/') && (options.method === 'PUT' || options.method === 'DELETE')) {
    const id = path.replace('/schedules/', '');
    const idx = schedules.findIndex(s => s.id === id);
    if (idx === -1) { const err: any = new Error('Not found'); err.status = 404; throw err; }
    if (options.method === 'DELETE') {
      schedules.splice(idx, 1);
      writeStore('mock_schedules', schedules);
      return { success: true };
    }
    const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
    schedules[idx] = { ...schedules[idx], ...body };
    writeStore('mock_schedules', schedules);
    return { schedule: schedules[idx] };
  }

  // Notifications store
  const notifications = readStore<any[]>('mock_notifications', []);

  // Assignments store helpers
  function writeAssignmentsStore(v: any[]) {
    writeStore('mock_assignments', v);
  }

  // Create notification
  if (path === '/notifications' && options.method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
    const id = `notif:${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newNotif = { id, timestamp, ...body };
    notifications.unshift(newNotif);
    writeStore('mock_notifications', notifications);
    return { notification: newNotif };
  }

  // Get notifications
  if (path === '/notifications' && (!options.method || options.method === 'GET')) {
    const roleParam = params.get('role');
    const batchId = params.get('batchId');
    const userId = params.get('userId');
    let filtered = notifications.slice();
    if (roleParam) {
      filtered = filtered.filter(n => n.targetRole === 'all' || n.targetRole === roleParam);
    }
    if (batchId) {
      filtered = filtered.filter(n => !n.batchId || n.batchId === batchId);
    }
    if (userId) {
      filtered = filtered.filter(n => n.targetUserId === userId || !n.targetUserId);
    }
    return { notifications: filtered };
  }

  // Assignments: create
  if (path === '/assignments' && options.method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
    const id = `assign:${Date.now()}`;
    const newAssign = { id, submissions: [], ...body };
    assignmentsStore.unshift(newAssign);
    writeAssignmentsStore(assignmentsStore);
    return { assignment: newAssign };
  }

  // Assignments: list (supports batchId filter)
  if (path === '/assignments' && (!options.method || options.method === 'GET')) {
    const batchId = params.get('batchId');
    const filtered = batchId ? assignmentsStore.filter(a => a.batchId === batchId) : assignmentsStore;
    return { assignments: filtered };
  }

  // Submit assignment
  if (path.match(/^\/assignments\/[^/]+\/submit$/) && options.method === 'POST') {
    const id = path.replace('/assignments/', '').replace('/submit', '');
    const idx = assignmentsStore.findIndex(a => a.id === id);
    if (idx === -1) { const err: any = new Error('Not found'); err.status = 404; throw err; }
    const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
    const submission = { studentId: body.studentId, studentName: body.studentName, projectLink: body.projectLink, points: null };
    assignmentsStore[idx].submissions = assignmentsStore[idx].submissions || [];
    assignmentsStore[idx].submissions.push(submission);
    writeAssignmentsStore(assignmentsStore);
    return { submission };
  }

  // Grade assignment
  if (path.match(/^\/assignments\/[^/]+\/grade$/) && options.method === 'POST') {
    const id = path.replace('/assignments/', '').replace('/grade', '');
    const idx = assignmentsStore.findIndex(a => a.id === id);
    if (idx === -1) { const err: any = new Error('Not found'); err.status = 404; throw err; }
    const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
    const submission = assignmentsStore[idx].submissions.find((s: any) => s.studentId === body.studentId);
    if (!submission) {
      const err: any = new Error('Submission not found'); err.status = 404; throw err;
    }
    submission.points = body.points;
    writeAssignmentsStore(assignmentsStore);
    return { success: true };
  }

  // Not implemented endpoints return 501 so the UI can show a meaningful error
  const notImpl: any = new Error('Not implemented in client mock');
  notImpl.status = 501;
  throw notImpl;
}

let sessionId: string | null = null;

export function setSessionId(id: string | null) {
  sessionId = id;
  if (id) {
    localStorage.setItem('sessionId', id);
  } else {
    localStorage.removeItem('sessionId');
  }
}

export function getSessionId(): string | null {
  if (!sessionId) {
    sessionId = localStorage.getItem('sessionId');
  }
  return sessionId;
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  if (USE_CLIENT_MOCK) {
    return clientMockCall(endpoint, options);
  }
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    // No global bearer token required when using Firebase-backed server
    ...(options.headers || {}),
  };

  const sid = getSessionId();
  if (sid) {
    headers['X-Session-ID'] = sid;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  let responseBody: any = null;
  try {
    if (!response.ok) {
      responseBody = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(responseBody.error || 'Request failed');
    }

    responseBody = await response.json().catch(() => null);
    return responseBody;
  } catch (fetchErr: any) {
    // If fetch itself failed (network error) it will be a TypeError with message 'Failed to fetch'
    if (fetchErr instanceof TypeError) {
      console.error('Network error when calling API:', `${BASE_URL}${endpoint}`, fetchErr);

      // Development convenience: if we're running on localhost, attempt to
      // service the request from the in-browser client mock as a fallback so
      // developers don't get blocked by external DNS/network issues.
      try {
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          console.warn('Fetch failed; falling back to client mock for', endpoint);
          const mockResult = await clientMockCall(endpoint, options);
          return mockResult;
        }
      } catch (mockErr) {
        console.warn('Client mock also failed:', mockErr);
      }

      throw new Error(`Network error: could not reach API (${fetchErr.message}). Please check your internet connection or that the API URL is correct: ${BASE_URL}${endpoint}`);
    }

    // Re-throw other errors (including those created above from responseBody)
    throw fetchErr;
  }
}

export const api = {
  // Auth
  login: async (email: string, password: string, role: string) => {
    // Try Firebase client sign-in first (recommended)
    if (typeof window !== 'undefined') {
      try {
        const auth = getFirebaseAuth();
        const res = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await res.user.getIdToken();
        return apiCall('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ idToken }),
        });
      } catch (e) {
        // Fall back to legacy username/password API
        console.warn('Firebase sign-in failed, falling back to legacy auth:', e);
      }
    }
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: email, password, role }),
    });
  },

  checkSession: () => apiCall('/auth/session'),

  logout: () =>
    apiCall('/auth/logout', {
      method: 'POST',
    }),

  // Users
  createUser: (data: any) =>
    apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getUsers: (role?: string) =>
    apiCall(`/users${role ? `?role=${role}` : ''}`),

  updateUser: (userId: string, data: any) =>
    apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteUser: (userId: string) =>
    apiCall(`/users/${userId}`, {
      method: 'DELETE',
    }),

  // Batches
  createBatch: (data: any) =>
    apiCall('/batches', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getBatches: () => apiCall('/batches'),

  getBatch: (batchId: string) => apiCall(`/batches/${batchId}`),

  updateBatch: (batchId: string, data: any) =>
    apiCall(`/batches/${batchId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteBatch: (batchId: string) =>
    apiCall(`/batches/${batchId}`, {
      method: 'DELETE',
    }),

  // Assignments
  createAssignment: (data: any) =>
    apiCall('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAssignments: (batchId?: string) =>
    apiCall(`/assignments${batchId ? `?batchId=${batchId}` : ''}`),

  submitAssignment: (assignmentId: string, studentId: string, projectLink: string, studentName: string) =>
    apiCall(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ studentId, projectLink, studentName }),
    }),

  gradeAssignment: (assignmentId: string, studentId: string, points: number) =>
    apiCall(`/assignments/${assignmentId}/grade`, {
      method: 'POST',
      body: JSON.stringify({ studentId, points }),
    }),

  // Schedules
  createSchedule: (data: any) =>
    apiCall('/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getSchedules: (batchId?: string) =>
    apiCall(`/schedules${batchId ? `?batchId=${batchId}` : ''}`),

  deleteSchedule: (scheduleId: string) =>
    apiCall(`/schedules/${scheduleId}`, {
      method: 'DELETE',
    }),

  // Notifications
  createNotification: (data: any) =>
    apiCall('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getNotifications: (role: string, batchId?: string, userId?: string) =>
    apiCall(`/notifications?role=${role}${batchId ? `&batchId=${batchId}` : ''}${userId ? `&userId=${encodeURIComponent(userId)}` : ''}`),
  deleteNotification: (notificationId: string) =>
    apiCall(`/notifications/${notificationId}`, {
      method: 'DELETE',
    }),
};
