import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

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

// Request ID middleware for tracking
app.use((req, res, next) => {
  req.id = randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      requestId: req.id,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
    }));
  });
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to wrap Vercel-style handlers for Express
const wrapHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error(JSON.stringify({
      requestId: req.id,
      error: 'Handler error',
      message: error.message,
      stack: error.stack,
      path: req.path,
    }));
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        requestId: req.id
      });
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

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'acquisition-assistant-api',
    version: '1.0.0'
  });
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'acquisition-assistant-api',
    version: '1.0.0'
  });
});

// Root endpoint (helpful for debugging)
app.get('/', (req, res) => {
  res.json({
    service: 'Acquisition Assistant API',
    version: '1.0.0',
    endpoints: [
      'POST /api/chat',
      'POST /api/mcp',
      'POST /api/document-analysis',
      'POST /api/url-query',
      'POST /api/slide-ranger',
      'GET /health',
      'GET /api/health'
    ],
    status: 'running'
  });
});

// Graceful shutdown handler
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({
    message: 'Server started',
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
    timestamp: new Date().toISOString()
  }));
});

// Handle graceful shutdown
const shutdown = (signal) => {
  console.log(JSON.stringify({
    message: `${signal} received, shutting down gracefully`,
    timestamp: new Date().toISOString()
  }));

  server.close(() => {
    console.log(JSON.stringify({
      message: 'Server closed',
      timestamp: new Date().toISOString()
    }));
    process.exit(0);
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error(JSON.stringify({
      message: 'Forced shutdown after timeout',
      timestamp: new Date().toISOString()
    }));
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
