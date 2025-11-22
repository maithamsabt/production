import { Router } from 'express';
import { db } from '../db';
import { settings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Get settings (returns first settings record or creates default one)
router.get('/', authenticate, async (req, res) => {
  try {
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

    res.json(settingsRecord);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settings (admin only)
router.put('/', authenticate, authorize('admin'), async (req: any, res) => {
  try {
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
    updates.updatedBy = req.user.id;

    let result;
    if (settingsRecord) {
      // Update existing
      [result] = await db.update(settings)
        .set(updates)
        .where(eq(settings.id, settingsRecord.id))
        .returning();
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
          updatedBy: req.user.id,
        })
        .returning();
    }

    res.json(result);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
