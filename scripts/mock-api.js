// Simple mock API for local development to emulate the Supabase function endpoints used by the app.
// Run with: node scripts/mock-api.js

const http = require('http');

const PORT = 4000;

function jsonResponse(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const { method, url } = req;

  // Basic CORS handling so browser can call this mock from another origin (vite dev server)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID');

  // Handle preflight
  if (method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Expect path like /functions/v1/make-server-f258bbc4/auth/login
  if (method === 'POST' && url.endsWith('/auth/login')) {
    let body = '';
    req.on('data', (chunk) => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        // Accept demo admin credentials
        if (data.username === 'Dharshith24' && data.password === 'dharshith@hari24') {
          return jsonResponse(res, 200, {
            success: true,
            sessionId: 'local-demo-session',
            user: { id: 'admin:Dharshith24', username: 'Dharshith24', role: 'admin', name: 'Admin', batchId: null }
          });
        }

        return jsonResponse(res, 401, { error: 'Invalid credentials' });
      } catch (e) {
        return jsonResponse(res, 400, { error: 'Invalid JSON' });
      }
    });
    return;
  }

  if (method === 'GET' && url.endsWith('/auth/session')) {
    // read X-Session-ID header
    const sid = req.headers['x-session-id'];
    if (sid === 'local-demo-session') {
      return jsonResponse(res, 200, { user: { id: 'admin:Dharshith24', username: 'Dharshith24', role: 'admin', name: 'Admin' } });
    }
    return jsonResponse(res, 401, { error: 'No session' });
  }

  // basic endpoints used by the UI can be mocked here if needed
  jsonResponse(res, 404, { error: 'Not implemented in mock' });
});

server.listen(PORT, () => {
  console.log(`Mock API server listening on http://localhost:${PORT}`);
});
