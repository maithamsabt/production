import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db/index.js';
import { vendors } from '../../server/db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, handleError } from '../_middleware/auth.js';

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const user = authenticate(req);

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

      const allVendors = await db.query.vendors.findMany({
        orderBy: (vendorsTable, { asc }) => [asc(vendorsTable.name)],
      });

      return res.status(200).json(allVendors);
    }

    if (req.method === 'POST') {
      if (!user || (user.role !== 'maker' && user.role !== 'checker' && user.role !== 'admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

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

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    handleError(error, res);
  }
}
