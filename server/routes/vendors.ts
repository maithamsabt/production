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
    const { name, contactPerson, email, phone, address, vat, isActive } = req.body;

    if (!name || !contactPerson || !email || !phone || !address) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    const [newVendor] = await db.insert(vendors).values({
      name,
      contactPerson,
      email,
      phone,
      address,
      vat: vat || 0,
      isActive: isActive !== undefined ? isActive : true,
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
    const { name, contactPerson, email, phone, address, vat, isActive } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (contactPerson !== undefined) updates.contactPerson = contactPerson;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (vat !== undefined) updates.vat = vat;
    if (isActive !== undefined) updates.isActive = isActive;

    const [updatedVendor] = await db.update(vendors)
      .set(updates)
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
