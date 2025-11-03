import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { users } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Get all users (admin and checker only)
router.get('/', authenticate, authorize('admin', 'checker'), async (req: any, res) => {
  try {
    const allUsers = await db.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    // Remove password hashes
    const usersData = allUsers.map(({ passwordHash, ...user }) => user);

    // If checker, only return makers
    if (req.user.role === 'checker') {
      return res.json(usersData.filter(u => u.role === 'maker'));
    }

    res.json(usersData);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.params.id),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check permissions
    if (req.user.role === 'maker' && user.id !== req.user.id) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { passwordHash, ...userData } = user;
    res.json(userData);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create user
router.post('/', authenticate, authorize('admin', 'checker'), async (req: any, res) => {
  try {
    const { username, password, role, name } = req.body;

    // Validation
    if (!username || !password || !role || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Permission check
    if (req.user.role === 'checker' && role !== 'maker') {
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
    res.status(201).json(userData);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const { username, password, role, name, isActive } = req.body;
    const targetUserId = req.params.id;

    const targetUser = await db.query.users.findFirst({
      where: eq(users.id, targetUserId),
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Permission checks
    if (req.user.role === 'maker') {
      if (targetUserId !== req.user.id) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      if (role || isActive !== undefined || username) {
        return res.status(403).json({ error: 'Makers can only update their own name' });
      }
    }

    if (req.user.role === 'checker') {
      if (targetUser.role !== 'maker' && targetUserId !== req.user.id) {
        return res.status(403).json({ error: 'Checkers cannot modify admin or other checker accounts' });
      }
      if (role && role !== 'maker') {
        return res.status(403).json({ error: 'Checkers cannot assign admin or checker roles' });
      }
    }

    // Cannot deactivate self
    if (targetUserId === req.user.id && isActive === false) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const updates: any = {};
    if (username) {
      // Check if new username exists
      const existingUser = await db.query.users.findFirst({
        where: and(eq(users.username, username), eq(users.id, targetUserId)),
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
    res.json(userData);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/:id', authenticate, authorize('admin'), async (req: any, res) => {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await db.delete(users).where(eq(users.id, targetUserId));

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
