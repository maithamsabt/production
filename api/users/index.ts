import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { db } from '../../server/db/index.js';
import { users } from '../../server/db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, authorize, handleError } from '../_middleware/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const user = authenticate(req);

    if (req.method === 'GET') {
      // Get all users (admin and checker only)
      authorize(user, 'admin', 'checker');

      const allUsers = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      });

      // Remove password hashes
      const usersData = allUsers.map(({ passwordHash, ...u }) => u);

      // If checker, only return makers
      if (user.role === 'checker') {
        return res.status(200).json(usersData.filter(u => u.role === 'maker'));
      }

      return res.status(200).json(usersData);
    }

    if (req.method === 'POST') {
      // Create user
      authorize(user, 'admin', 'checker');

      const { username, password, role, name } = req.body;

      // Validation
      if (!username || !password || !role || !name) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }

      // Permission check
      if (user.role === 'checker' && role !== 'maker') {
        return res.status(403).json({ error: 'Checkers can only create maker accounts' });
      }

      // Check if username exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username),
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const [newUser] = await db.insert(users).values({
        username,
        passwordHash,
        role,
        name,
        isActive: true,
      }).returning();

      const { passwordHash: _, ...userData } = newUser;
      return res.status(201).json(userData);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    handleError(error, res);
  }
}
