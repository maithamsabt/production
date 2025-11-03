import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends VercelRequest {
  user?: {
    id: string;
    username: string;
    role: string;
  };
}

export function authenticate(req: VercelRequest): {
  id: string;
  username: string;
  role: string;
} {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Authentication required');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      role: string;
    };
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

export function authorize(user: { role: string }, ...roles: string[]): void {
  if (!roles.includes(user.role)) {
    throw new Error('Insufficient permissions');
  }
}

export function handleError(error: any, res: VercelResponse): void {
  console.error('API Error:', error);
  
  if (error.message === 'Authentication required') {
    res.status(401).json({ error: error.message });
  } else if (error.message === 'Insufficient permissions') {
    res.status(403).json({ error: error.message });
  } else if (error.message === 'Invalid or expired token') {
    res.status(401).json({ error: error.message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}
