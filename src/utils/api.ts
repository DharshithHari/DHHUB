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
