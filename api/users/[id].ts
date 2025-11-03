import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { db } from '../../server/db/index.js';
import { users } from '../../server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authenticate, authorize, handleError } from '../_middleware/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const user = authenticate(req);
    const targetUserId = req.query.id as string;

    if (req.method === 'GET') {
      // Get user by ID
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetUserId),
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check permissions
      if (user.role === 'maker' && targetUser.id !== user.id) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { passwordHash, ...userData } = targetUser;
      return res.status(200).json(userData);
    }

    if (req.method === 'PUT') {
      // Update user
      const { username, password, role, name, isActive } = req.body;

      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, targetUserId),
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Permission checks
      if (user.role === 'maker') {
        if (targetUserId !== user.id) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }
        if (role || isActive !== undefined || username) {
          return res.status(403).json({ error: 'Makers can only update their own name' });
        }
      }

      if (user.role === 'checker') {
        if (targetUser.role !== 'maker' && targetUserId !== user.id) {
          return res.status(403).json({ error: 'Checkers cannot modify admin or other checker accounts' });
        }
        if (role && role !== 'maker') {
          return res.status(403).json({ error: 'Checkers cannot assign admin or checker roles' });
        }
      }

      // Cannot deactivate self
      if (targetUserId === user.id && isActive === false) {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
      }

      const updates: any = {};
      if (username) {
        // Check if new username exists
        const existingUser = await db.query.users.findFirst({
          where: eq(users.username, username),
        });
        if (existingUser && existingUser.id !== targetUserId) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        updates.username = username;
      }
      if (password) {
        if (password.length < 8) {
          return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        updates.passwordHash = await bcrypt.hash(password, 10);
      }
      if (role) updates.role = role;
      if (name) updates.name = name;
      if (isActive !== undefined) updates.isActive = isActive;

      const [updatedUser] = await db.update(users)
        .set(updates)
        .where(eq(users.id, targetUserId))
        .returning();

      const { passwordHash, ...userData } = updatedUser;
      return res.status(200).json(userData);
    }

    if (req.method === 'DELETE') {
      // Delete user (admin only)
      authorize(user, 'admin');

      if (targetUserId === user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await db.delete(users).where(eq(users.id, targetUserId));
      return res.status(200).json({ message: 'User deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    handleError(error, res);
  }
}
