import app from '../server';

export const maxDuration = 30;

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}
