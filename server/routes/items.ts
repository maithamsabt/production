import { Router } from 'express';
import { db } from '../db';
import { items } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all items
router.get('/', authenticate, async (req, res) => {
  try {
    const allItems = await db.query.items.findMany({
      orderBy: (items, { asc }) => [asc(items.name)],
    });

    res.json(allItems);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get item by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const item = await db.query.items.findFirst({
      where: eq(items.id, req.params.id),
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create item
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, unit } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Item name is required' });
    }

    const [newItem] = await db.insert(items).values({
      name,
      description,
      unit,
    }).returning();

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update item
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, description, unit } = req.body;

    const [updatedItem] = await db.update(items)
      .set({ name, description, unit })
      .where(eq(items.id, req.params.id))
      .returning();

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete item
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.delete(items).where(eq(items.id, req.params.id));
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
