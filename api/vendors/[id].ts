import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db/index.js';
import { vendors } from '../../server/db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, handleError } from '../_middleware/auth.js';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const user = authenticate(req);
    const idParam = req.query.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    if (!id) {
      return res.status(400).json({ error: 'Vendor ID is required' });
    }

    if (req.method === 'GET') {
      const vendor = await db.query.vendors.findFirst({
        where: eq(vendors.id, id),
      });

      if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      return res.status(200).json(vendor);
    }

    if (req.method === 'PUT') {
      if (!user || (user.role !== 'maker' && user.role !== 'checker' && user.role !== 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { name, contactPerson, email, phone, address, vat, isActive } = req.body;

      const updates: Record<string, unknown> = {};
      if (name !== undefined) updates.name = name;
      if (contactPerson !== undefined) updates.contactPerson = contactPerson;
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      if (address !== undefined) updates.address = address;
      if (vat !== undefined) updates.vat = vat;
      if (isActive !== undefined) updates.isActive = isActive;

      const [updatedVendor] = await db.update(vendors)
        .set(updates)
        .where(eq(vendors.id, id))
        .returning();

      if (!updatedVendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      return res.status(200).json(updatedVendor);
    }

    if (req.method === 'DELETE') {
      if (!user || (user.role !== 'maker' && user.role !== 'checker' && user.role !== 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      await db.delete(vendors).where(eq(vendors.id, id));
      return res.status(200).json({ message: 'Vendor deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    handleError(error, res);
  }
}
