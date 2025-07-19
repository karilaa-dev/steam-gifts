import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import auth from './auth';
import proxy from './proxy';
import { config } from '../../config';

const app = new Hono();

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mount the authentication and proxy routes
app.route('/auth', auth);
app.route('/api', proxy);

// Serve static assets from the client's dist folder
app.use('/*', serveStatic({ root: './dist' }));

// Serve the main index.html for any route not caught by the API
app.get('/*', serveStatic({ path: './dist/index.html' }));

console.log(`✅ Server is running on http://localhost:${config.port}`);
console.log(`📡 API endpoints available at http://localhost:${config.port}/api/*`);
console.log(`🔐 Auth endpoints available at http://localhost:${config.port}/auth/*`);

serve({
  fetch: app.fetch,
  port: config.port,
});