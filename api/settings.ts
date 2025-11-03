import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/db/index.js';
import { settings } from '../server/db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, authorize, handleError } from './_middleware/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const user = authenticate(req);

    if (req.method === 'GET') {
      let settingsRecord = await db.query.settings.findFirst();
      
      // If no settings exist, create default ones
      if (!settingsRecord) {
        [settingsRecord] = await db.insert(settings).values({
          companyName: 'Your Company Name',
          companyAddress: 'Your Company Address',
          companyPhone: '+1234567890',
          companyEmail: 'info@company.com',
          defaultVat: '15',
        }).returning();
      }

      return res.status(200).json(settingsRecord);
    }

    if (req.method === 'PUT') {
      authorize(user, 'admin');

      const { companyName, companyAddress, companyPhone, companyEmail, defaultVat, checkerSignature } = req.body;

      // Get existing settings
      let settingsRecord = await db.query.settings.findFirst();

      const updates: any = {};
      if (companyName !== undefined) updates.companyName = companyName;
      if (companyAddress !== undefined) updates.companyAddress = companyAddress;
      if (companyPhone !== undefined) updates.companyPhone = companyPhone;
      if (companyEmail !== undefined) updates.companyEmail = companyEmail;
      if (defaultVat !== undefined) updates.defaultVat = defaultVat;
      if (checkerSignature !== undefined) updates.checkerSignature = checkerSignature;
      updates.updatedBy = user.id;

      let result;
      if (settingsRecord) {
        // Update existing settings record
        const [updated] = await db.update(settings)
          .set(updates)
          .where(eq(settings.id, settingsRecord.id))
          .returning();
        result = updated;
      } else {
        // Create new
        [result] = await db.insert(settings)
          .values({
            companyName: companyName || 'Your Company Name',
            companyAddress: companyAddress || 'Your Company Address',
            companyPhone: companyPhone || '+1234567890',
            companyEmail: companyEmail || 'info@company.com',
            defaultVat: defaultVat || '15',
            checkerSignature,
            updatedBy: user.id,
          })
          .returning();
      }

      return res.status(200).json(result);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    handleError(error, res);
  }
}
