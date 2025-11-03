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

function parseCookies(cookieHeader: string): Record<string, string> {
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
}

export function authenticate(req: VercelRequest): {
  id: string;
  username: string;
  role: string;
} {
  // Try to get token from cookie first, then Authorization header
  let token: string | undefined;
  
  if (req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies.token;
  }
  
  // Fallback to Authorization header
  if (!token && req.headers.authorization) {
    token = req.headers.authorization.replace('Bearer ', '');
  }

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
