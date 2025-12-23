import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import API handlers
import chatHandler from './api/chat.js';
import mcpHandler from './api/chat-with-mcp.js';
import slideRangerHandler from './api/slide-ranger.js';
import documentAnalysisHandler from './api/document-analysis.js';
import urlQueryHandler from './api/url-query.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper to wrap Vercel-style handlers for Express
const wrapHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }
};

// API Routes
app.post('/api/chat', wrapHandler(chatHandler));
app.options('/api/chat', wrapHandler(chatHandler));

app.post('/api/mcp', wrapHandler(mcpHandler));
app.post('/api/chat-with-mcp', wrapHandler(mcpHandler));
app.options('/api/mcp', wrapHandler(mcpHandler));
app.options('/api/chat-with-mcp', wrapHandler(mcpHandler));

app.post('/api/document-analysis', wrapHandler(documentAnalysisHandler));
app.options('/api/document-analysis', wrapHandler(documentAnalysisHandler));

app.post('/api/url-query', wrapHandler(urlQueryHandler));
app.options('/api/url-query', wrapHandler(urlQueryHandler));

app.post('/api/slide-ranger', wrapHandler(slideRangerHandler));
app.options('/api/slide-ranger', wrapHandler(slideRangerHandler));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API Key configured: ${!!process.env.ANTHROPIC_API_KEY}`);
});
