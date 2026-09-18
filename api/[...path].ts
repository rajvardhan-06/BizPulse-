import app from '../server';

export default function handler(req: any, res: any) {
  if (req.query && req.query.path) {
    const p = Array.isArray(req.query.path) ? req.query.path.join('/') : String(req.query.path);
    req.url = `/api/${p.replace(/^\//, '')}`;
  } else {
    const forwardedUri = req.headers?.['x-forwarded-uri'] || req.headers?.['x-matched-path'] || req.headers?.['x-original-url'];
    if (forwardedUri && typeof forwardedUri === 'string') {
      req.url = forwardedUri;
    }
  }
  return app(req, res);
}
