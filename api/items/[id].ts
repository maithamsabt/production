import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db/index.js';
import { items } from '../../server/db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, handleError } from '../_middleware/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const user = authenticate(req);
    const id = req.query.id as string | undefined;

    if (!id) {
      return res.status(400).json({ error: 'Item id is required' });
    }

    if (req.method === 'GET') {
      const item = await db.query.items.findFirst({ where: eq(items.id, id) });
      if (!item) return res.status(404).json({ error: 'Item not found' });
      return res.status(200).json(item);
    }

    // Maker, checker or admin can modify items
    if (!user || (user.role !== 'maker' && user.role !== 'checker' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    if (req.method === 'PUT') {
      const { name, description, specification, unit, category, isActive, isVatable } = req.body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (specification !== undefined) updates.specification = specification;
      if (unit !== undefined) updates.unit = unit;
      if (category !== undefined) updates.category = category;
      if (isActive !== undefined) updates.isActive = isActive;
      if (isVatable !== undefined) updates.isVatable = isVatable;

      const [updatedItem] = await db.update(items).set(updates).where(eq(items.id, id)).returning();
      if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
      return res.status(200).json(updatedItem);
    }

    if (req.method === 'DELETE') {
      await db.delete(items).where(eq(items.id, id));
      return res.status(200).json({ message: 'Item deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    handleError(error, res);
  }
}
