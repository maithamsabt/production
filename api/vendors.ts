import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/db/index.js';
import { vendors } from '../server/db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, handleError } from './_middleware/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    authenticate(req);

    if (req.method === 'GET') {
      const id = req.query.id as string | undefined;

      if (id) {
        const vendor = await db.query.vendors.findFirst({
          where: eq(vendors.id, id),
        });

        if (!vendor) {
          return res.status(404).json({ error: 'Vendor not found' });
        }

        return res.status(200).json(vendor);
      }

      // Get all vendors
      const allVendors = await db.query.vendors.findMany({
        orderBy: (vendors, { asc }) => [asc(vendors.name)],
      });

      return res.status(200).json(allVendors);
    }

    if (req.method === 'POST') {
      const { name, contactPerson, email, phone, address, vat } = req.body;

      if (!name || !contactPerson || !email || !phone || !address) {
        return res.status(400).json({ error: 'All required fields must be provided' });
      }

      const [newVendor] = await db.insert(vendors).values({
        name,
        contactPerson,
        email,
        phone,
        address,
        vat: vat || '0',
      }).returning();

      return res.status(201).json(newVendor);
    }

    if (req.method === 'PUT') {
      const id = req.query.id as string;
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
        .where(eq(vendors.id, id))
        .returning();

      if (!updatedVendor) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      return res.status(200).json(updatedVendor);
    }

    if (req.method === 'DELETE') {
      const id = req.query.id as string;
      await db.delete(vendors).where(eq(vendors.id, id));
      return res.status(200).json({ message: 'Vendor deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    handleError(error, res);
  }
}
