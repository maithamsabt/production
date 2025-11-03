import { Router } from 'express';
import { db } from '../db';
import { vendors } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all vendors
router.get('/', authenticate, async (req, res) => {
  try {
    const allVendors = await db.query.vendors.findMany({
      orderBy: (vendors, { asc }) => [asc(vendors.name)],
    });

    res.json(allVendors);
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get vendor by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.id, req.params.id),
    });

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create vendor
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, contactInfo } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Vendor name is required' });
    }

    const [newVendor] = await db.insert(vendors).values({
      name,
      contactInfo,
    }).returning();

    res.status(201).json(newVendor);
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update vendor
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, contactInfo } = req.body;

    const [updatedVendor] = await db.update(vendors)
      .set({ name, contactInfo })
      .where(eq(vendors.id, req.params.id))
      .returning();

    if (!updatedVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json(updatedVendor);
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete vendor
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await db.delete(vendors).where(eq(vendors.id, req.params.id));
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
