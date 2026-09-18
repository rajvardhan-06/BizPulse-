import app from '../server';

export default function handler(req: any, res: any) {
  // Normalize URL in Vercel Serverless environment
  const forwardedUri = req.headers?.['x-forwarded-uri'] || req.headers?.['x-matched-path'] || req.headers?.['x-original-url'];
  if (forwardedUri && typeof forwardedUri === 'string' && (forwardedUri.startsWith('/api') || forwardedUri.startsWith('/auth'))) {
    req.url = forwardedUri;
  } else if (req.query && (req.query['0'] || req.query['1'] || req.query['path'])) {
    const rawPath = req.query['0'] || req.query['1'] || req.query['path'];
    const p = Array.isArray(rawPath) ? rawPath.join('/') : String(rawPath);
    req.url = `/api/${p.replace(/^\//, '')}`;
  } else if (req.url && (req.url === '/' || req.url === '/api' || req.url === '/api/')) {
    const routeMatches = req.headers?.['x-now-route-matches'];
    if (typeof routeMatches === 'string') {
      const match = routeMatches.match(/1=([^&]+)/);
      if (match && match[1]) {
        req.url = `/api/${decodeURIComponent(match[1]).replace(/^\//, '')}`;
      }
    }
  }

  return app(req, res);
}
