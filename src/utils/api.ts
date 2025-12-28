import { projectId, publicAnonKey } from './supabase/info';

const DEFAULT_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-f258bbc4`;
const LOCAL_FALLBACK = `http://localhost:4000/functions/v1/make-server-f258bbc4`;

// Allow explicit override via Vite env var VITE_API_BASE (set this when running dev to force localhost)
declare const import_meta: any;
const envBase = typeof (import.meta) !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE
  ? (import.meta as any).env.VITE_API_BASE
  : null;

const BASE_URL = envBase || ((typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? LOCAL_FALLBACK
  : DEFAULT_BASE);

// If the developer sets `VITE_API_BASE=LOCAL_MOCK` we bypass network calls and
// use an in-browser mock implementation. This is useful when DNS/network to
// the real function host is unreliable during local development.
const USE_CLIENT_MOCK = envBase === 'LOCAL_MOCK';

// Simple in-client mock implementation for the minimal auth endpoints used
// during development. It stores a demo session id in localStorage so the
// rest of the app can continue using `getSessionId()`.
async function clientMockCall(endpoint: string, options: RequestInit = {}) {
  // mimic the real endpoints: POST /auth/login and GET /auth/session
  if (endpoint === '/auth/login' && options.method === 'POST') {
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

  if (endpoint === '/auth/session' && (!options.method || options.method === 'GET')) {
    const sid = getSessionId();
    if (sid === 'local-demo-session') {
      return { user: { id: 'admin:Dharshith24', username: 'Dharshith24', role: 'admin', name: 'Admin' } };
    }
    const err: any = new Error('No session');
    err.status = 401;
    throw err;
  }

  // For other endpoints the mock is not implemented yet.
  const notImpl: any = new Error('Not implemented in client mock');
  notImpl.status = 501;
  throw notImpl;
}
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
      { id: 'admin:Dharshith24', username: 'Dharshith24', role: 'admin', name: 'Admin', batchId: null }
    ]);
    const batches = readStore<any[]>('mock_batches', []);
    const schedules = readStore<any[]>('mock_schedules', []);

    // parse query params if present
    const [path, q] = endpoint.split('?');
    const params = new URLSearchParams(q || '');

    // Users: create
    if (path === '/users' && options.method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
      const id = `user:${Date.now()}`;
      const newUser = { id, ...body };
      users.push(newUser);
      writeStore('mock_users', users);
      return newUser;
    }

    // Users: list (supports role filter)
    if (path === '/users' && (!options.method || options.method === 'GET')) {
      const role = params.get('role');
      if (role) return users.filter(u => u.role === role);
      return users;
    }

    // Batches: create
    if (path === '/batches' && options.method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
      const id = `batch:${Date.now()}`;
      const newBatch = { id, ...body };
      batches.push(newBatch);
      writeStore('mock_batches', batches);
      return newBatch;
    }

    // Batches: list
    if (path === '/batches' && (!options.method || options.method === 'GET')) {
      return batches;
    }

    // Schedules: create
    if (path === '/schedules' && options.method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body as string) : {};
      const id = `schedule:${Date.now()}`;
      const newSched = { id, ...body };
      schedules.push(newSched);
      writeStore('mock_schedules', schedules);
      return newSched;
    }

    // Schedules: list (supports batchId filter)
    if (path === '/schedules' && (!options.method || options.method === 'GET')) {
      const batchId = params.get('batchId');
      if (batchId) return schedules.filter(s => s.batchId === batchId);
      return schedules;
    }

    // Not implemented endpoints return 501 so the UI can show a meaningful error
    const notImpl: any = new Error('Not implemented in client mock');
    notImpl.status = 501;
    throw notImpl;

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
    Authorization: `Bearer ${publicAnonKey}`,
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
      throw new Error(`Network error: could not reach API (${fetchErr.message}). Please check your internet connection or that the API URL is correct: ${BASE_URL}${endpoint}`);
    }

    // Re-throw other errors (including those created above from responseBody)
    throw fetchErr;
  }
}

export const api = {
  // Auth
  login: (username: string, password: string, role: string) =>
    apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, role }),
    }),

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
