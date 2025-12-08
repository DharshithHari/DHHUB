import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';
import { createClient } from 'npm:@supabase/supabase-js@2';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Utility function to hash password (simple for demo)
function hashPassword(password: string): string {
  return btoa(password);
}

function verifyPassword(password: string, hash: string): boolean {
  return btoa(password) === hash;
}

// Initialize default admin user
async function initializeDefaultUsers() {
  const adminExists = await kv.get('user:admin:Dharshith24');
  if (!adminExists) {
    await kv.set('user:admin:Dharshith24', {
      id: 'admin:Dharshith24',
      username: 'Dharshith24',
      password: hashPassword('dharshith@hari24'),
      role: 'admin',
      name: 'Admin'
    });
    console.log('Default admin user created');
  }
}

initializeDefaultUsers();

// Auth Routes
app.post('/make-server-f258bbc4/auth/login', async (c) => {
  try {
    const { username, password, role } = await c.req.json();
    
    const user = await kv.get(`user:${role}:${username}`);
    
    if (!user || !verifyPassword(password, user.password)) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }
    
    // Create session
    const sessionId = crypto.randomUUID();
    await kv.set(`session:${sessionId}`, {
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      batchId: user.batchId || null
    });
    
    return c.json({ 
      success: true, 
      sessionId,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        batchId: user.batchId || null
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

app.get('/make-server-f258bbc4/auth/session', async (c) => {
  try {
    const sessionId = c.req.header('X-Session-ID');
    if (!sessionId) {
      return c.json({ error: 'No session' }, 401);
    }
    
    const session = await kv.get(`session:${sessionId}`);
    if (!session) {
      return c.json({ error: 'Invalid session' }, 401);
    }
    
    return c.json({ user: session });
  } catch (error) {
    console.error('Session check error:', error);
    return c.json({ error: 'Session check failed' }, 500);
  }
});

app.post('/make-server-f258bbc4/auth/logout', async (c) => {
  try {
    const sessionId = c.req.header('X-Session-ID');
    if (sessionId) {
      await kv.del(`session:${sessionId}`);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

// User Management Routes
app.post('/make-server-f258bbc4/users', async (c) => {
  try {
    const { username, password, role, name, batchId } = await c.req.json();
    
    const userId = `${role}:${username}`;
    const existingUser = await kv.get(`user:${userId}`);
    
    if (existingUser) {
      return c.json({ error: 'Username already exists' }, 400);
    }
    
    const user = {
      id: userId,
      username,
      password: hashPassword(password),
      role,
      name,
      batchId: batchId || null,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(`user:${userId}`, user);
    
    return c.json({ success: true, user: { ...user, password: undefined } });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

app.get('/make-server-f258bbc4/users', async (c) => {
  try {
    const role = c.req.query('role');
    const prefix = role ? `user:${role}:` : 'user:';
    
    let users = await kv.getByPrefix(prefix);
    
    // Handle case where no users exist yet
    if (!users) {
      users = [];
    }
    
    // Ensure users is an array
    if (!Array.isArray(users)) {
      users = [];
    }
    
    const sanitizedUsers = users.map(u => ({ ...u, password: undefined }));
    
    return c.json({ users: sanitizedUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ error: 'Failed to get users' }, 500);
  }
});

app.delete('/make-server-f258bbc4/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    await kv.del(`user:${userId}`);
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

app.put('/make-server-f258bbc4/users/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const updates = await c.req.json();
    
    const user = await kv.get(`user:${userId}`);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const updatedUser = { ...user, ...updates };
    if (updates.password) {
      updatedUser.password = hashPassword(updates.password);
    }
    
    await kv.set(`user:${userId}`, updatedUser);
    
    return c.json({ success: true, user: { ...updatedUser, password: undefined } });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Batch Management Routes
app.post('/make-server-f258bbc4/batches', async (c) => {
  try {
    const { name, teacherId, meetLink } = await c.req.json();
    
    const batchId = `batch:${crypto.randomUUID()}`;
    const batch = {
      id: batchId,
      name,
      teacherId: teacherId || null,
      studentIds: [],
      meetLink: meetLink || '',
      createdAt: new Date().toISOString()
    };
    
    await kv.set(batchId, batch);
    
    return c.json({ success: true, batch });
  } catch (error) {
    console.error('Create batch error:', error);
    return c.json({ error: 'Failed to create batch' }, 500);
  }
});

app.get('/make-server-f258bbc4/batches', async (c) => {
  try {
    let batches = await kv.getByPrefix('batch:');
    
    // Handle case where no batches exist yet
    if (!batches) {
      batches = [];
    }
    
    // Ensure batches is an array
    if (!Array.isArray(batches)) {
      batches = [];
    }
    
    return c.json({ batches });
  } catch (error) {
    console.error('Get batches error:', error);
    return c.json({ error: 'Failed to get batches' }, 500);
  }
});

app.get('/make-server-f258bbc4/batches/:batchId', async (c) => {
  try {
    const batchId = c.req.param('batchId');
    const batch = await kv.get(batchId);
    
    if (!batch) {
      return c.json({ error: 'Batch not found' }, 404);
    }
    
    return c.json({ batch });
  } catch (error) {
    console.error('Get batch error:', error);
    return c.json({ error: 'Failed to get batch' }, 500);
  }
});

app.put('/make-server-f258bbc4/batches/:batchId', async (c) => {
  try {
    const batchId = c.req.param('batchId');
    const updates = await c.req.json();
    
    const batch = await kv.get(batchId);
    if (!batch) {
      return c.json({ error: 'Batch not found' }, 404);
    }
    
    const updatedBatch = { ...batch, ...updates };
    await kv.set(batchId, updatedBatch);
    
    return c.json({ success: true, batch: updatedBatch });
  } catch (error) {
    console.error('Update batch error:', error);
    return c.json({ error: 'Failed to update batch' }, 500);
  }
});

app.delete('/make-server-f258bbc4/batches/:batchId', async (c) => {
  try {
    const batchId = c.req.param('batchId');
    await kv.del(batchId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete batch error:', error);
    return c.json({ error: 'Failed to delete batch' }, 500);
  }
});

// Assignment Routes
app.post('/make-server-f258bbc4/assignments', async (c) => {
  try {
    const { batchId, title, description, dueDate, createdBy } = await c.req.json();
    
    const assignmentId = `assignment:${crypto.randomUUID()}`;
    const assignment = {
      id: assignmentId,
      batchId,
      title,
      description,
      dueDate,
      createdBy,
      submissions: [],
      createdAt: new Date().toISOString()
    };
    
    await kv.set(assignmentId, assignment);
    
    return c.json({ success: true, assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    return c.json({ error: 'Failed to create assignment' }, 500);
  }
});

app.get('/make-server-f258bbc4/assignments', async (c) => {
  try {
    const batchId = c.req.query('batchId');
    let assignments = await kv.getByPrefix('assignment:');
    
    // Handle case where no assignments exist yet
    if (!assignments) {
      assignments = [];
    }
    
    // Ensure assignments is an array
    if (!Array.isArray(assignments)) {
      assignments = [];
    }
    
    const filtered = batchId 
      ? assignments.filter(a => a.batchId === batchId)
      : assignments;
    
    return c.json({ assignments: filtered });
  } catch (error) {
    console.error('Get assignments error:', error);
    return c.json({ error: 'Failed to get assignments' }, 500);
  }
});

app.post('/make-server-f258bbc4/assignments/:assignmentId/submit', async (c) => {
  try {
    const assignmentId = c.req.param('assignmentId');
    const { studentId, projectLink, studentName } = await c.req.json();
    
    const assignment = await kv.get(assignmentId);
    if (!assignment) {
      return c.json({ error: 'Assignment not found' }, 404);
    }
    
    const existingSubmission = assignment.submissions.find(s => s.studentId === studentId);
    
    if (existingSubmission) {
      existingSubmission.projectLink = projectLink;
      existingSubmission.submittedAt = new Date().toISOString();
    } else {
      assignment.submissions.push({
        studentId,
        studentName,
        projectLink,
        points: null,
        submittedAt: new Date().toISOString()
      });
    }
    
    await kv.set(assignmentId, assignment);
    
    return c.json({ success: true, assignment });
  } catch (error) {
    console.error('Submit assignment error:', error);
    return c.json({ error: 'Failed to submit assignment' }, 500);
  }
});

app.post('/make-server-f258bbc4/assignments/:assignmentId/grade', async (c) => {
  try {
    const assignmentId = c.req.param('assignmentId');
    const { studentId, points } = await c.req.json();
    
    const assignment = await kv.get(assignmentId);
    if (!assignment) {
      return c.json({ error: 'Assignment not found' }, 404);
    }
    
    const submission = assignment.submissions.find(s => s.studentId === studentId);
    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404);
    }
    
    submission.points = points;
    submission.gradedAt = new Date().toISOString();
    
    await kv.set(assignmentId, assignment);
    
    return c.json({ success: true, assignment });
  } catch (error) {
    console.error('Grade assignment error:', error);
    return c.json({ error: 'Failed to grade assignment' }, 500);
  }
});

// Schedule Routes
app.post('/make-server-f258bbc4/schedules', async (c) => {
  try {
    const { batchId, date, time, title } = await c.req.json();
    
    const scheduleId = `schedule:${crypto.randomUUID()}`;
    const schedule = {
      id: scheduleId,
      batchId,
      date,
      time,
      title,
      createdAt: new Date().toISOString()
    };
    
    await kv.set(scheduleId, schedule);
    
    return c.json({ success: true, schedule });
  } catch (error) {
    console.error('Create schedule error:', error);
    return c.json({ error: 'Failed to create schedule' }, 500);
  }
});

app.get('/make-server-f258bbc4/schedules', async (c) => {
  try {
    const batchId = c.req.query('batchId');
    let schedules = await kv.getByPrefix('schedule:');
    
    // Handle case where no schedules exist yet
    if (!schedules) {
      schedules = [];
    }
    
    // Ensure schedules is an array
    if (!Array.isArray(schedules)) {
      schedules = [];
    }
    
    const filtered = batchId 
      ? schedules.filter(s => s.batchId === batchId)
      : schedules;
    
    return c.json({ schedules: filtered });
  } catch (error) {
    console.error('Get schedules error:', error);
    return c.json({ error: 'Failed to get schedules' }, 500);
  }
});

app.delete('/make-server-f258bbc4/schedules/:scheduleId', async (c) => {
  try {
    const scheduleId = c.req.param('scheduleId');
    await kv.del(scheduleId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Delete schedule error:', error);
    return c.json({ error: 'Failed to delete schedule' }, 500);
  }
});

// Notification Routes
app.post('/make-server-f258bbc4/notifications', async (c) => {
  try {
    // Allow optional targetUserId and meta payload for richer notifications
    const { senderId, senderName, targetRole, targetBatchId, targetUserId, message, meta } = await c.req.json();

    const notificationId = `notification:${crypto.randomUUID()}`;
    const notification: any = {
      id: notificationId,
      senderId,
      senderName,
      targetRole: targetRole || 'all',
      targetBatchId: targetBatchId || null,
      targetUserId: targetUserId || null,
      message,
      meta: meta || null,
      timestamp: new Date().toISOString()
    };

    await kv.set(notificationId, notification);

    return c.json({ success: true, notification });
  } catch (error) {
    console.error('Create notification error:', error);
    return c.json({ error: 'Failed to create notification' }, 500);
  }
});

app.get('/make-server-f258bbc4/notifications', async (c) => {
  try {
    const role = c.req.query('role');
    const batchId = c.req.query('batchId');
    const userId = c.req.query('userId');
    
    let notifications = await kv.getByPrefix('notification:');
    
    // Handle case where no notifications exist yet
    if (!notifications) {
      notifications = [];
    }
    
    // Ensure notifications is an array
    if (!Array.isArray(notifications)) {
      notifications = [];
    }
    
    const filtered = notifications.filter(n => {
      // Skip if notification object is invalid
      if (!n || typeof n !== 'object') return false;
      // Admin can view all notifications
      if (role === 'admin') return true;

      // If a userId is supplied and the notification explicitly targets a user, include it
      if (userId && n.targetUserId) {
        if (n.targetUserId === userId) return true;
      }

      if (n.targetRole === 'all') return true;
      if (n.targetRole === role) {
        if (n.targetBatchId) {
          return n.targetBatchId === batchId;
        }
        return true;
      }
      return false;
    });
    
    // Sort by timestamp descending
    filtered.sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });
    
    return c.json({ notifications: filtered });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: 'Failed to get notifications' }, 500);
  }
});

app.delete('/make-server-f258bbc4/notifications/:notificationId', async (c) => {
  try {
    // Normalize and decode the incoming param so we can accept either
    // the full key (e.g. "notification:...") or just the raw id part.
    const raw = c.req.param('notificationId') || '';
    const decoded = decodeURIComponent(raw);
    const candidates = [] as string[];

    // candidate 1: as provided
    candidates.push(decoded);
    // candidate 2: ensure it's prefixed
    if (!decoded.startsWith('notification:')) candidates.push(`notification:${decoded}`);

    console.log('DELETE /notifications called - raw param:', raw, 'decoded:', decoded, 'trying keys:', candidates);

    // Try each candidate and delete the first that exists
    for (const key of candidates) {
      try {
        const exists = await kv.get(key);
        if (exists) {
          console.log('Found existing notification for key, deleting:', key);
          await kv.del(key);
          return c.json({ success: true, deletedKey: key });
        } else {
          console.log('No entry for key:', key);
        }
      } catch (innerErr) {
        console.error('Error checking/deleting key', key, innerErr);
        // continue to next candidate
      }
    }

    console.warn('No notification found for any candidate keys', candidates);
    return c.json({ error: 'Notification not found', tried: candidates }, 404);
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json({ error: 'Failed to delete notification' }, 500);
  }
});

Deno.serve(app.fetch);