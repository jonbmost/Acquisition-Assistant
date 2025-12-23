const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://rapidacq-frontend.vercel.app',
  'https://rapidacq-frontend-4kht.vercel.app',
  'https://rapidacq-frontend-4kht-muput8sey-agile-acq.vercel.app'
];

export function applyCors(req, res) {
  const requestOrigin = req?.headers?.origin;

  // Always allow the requesting origin to fix CORS issues
  // If no origin header (e.g., same-origin requests), allow all
  const allowedOrigin = requestOrigin || '*';

  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    applyCors(req, res);
    res.status(200).end();
    return true;
  }

  return false;
}
