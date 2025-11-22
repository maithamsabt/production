import { Router } from 'express';
import { db } from '../db';
import { comparisons, comparisonRows, comparisonVendors, attachments, vendors } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all comparisons
router.get('/', authenticate, async (req: any, res) => {
  try {
    const user = req.user;
    let allComparisons;

    // Checkers and admins can see all comparisons
    // Regular users only see their own drafts + submitted/approved/rejected comparisons
    if (user.role === 'checker' || user.role === 'admin') {
      allComparisons = await db.query.comparisons.findMany({
        orderBy: (comparisons, { desc }) => [desc(comparisons.createdAt)],
        with: {
          creator: true,
          reviewer: true,
          rows: {
            with: {
              item: true,
            },
          },
        },
      });
    } else {
      // Regular users only see their own comparisons (all statuses)
      allComparisons = await db.query.comparisons.findMany({
        where: (comparisons, { eq }) => eq(comparisons.createdBy, user.id),
        orderBy: (comparisons, { desc }) => [desc(comparisons.createdAt)],
        with: {
          creator: true,
          reviewer: true,
          rows: {
            with: {
              item: true,
            },
          },
        },
      });
    }

    res.json(allComparisons);
  } catch (error) {
    console.error('Get comparisons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comparison by ID with full details for viewing/printing
router.get('/:id', authenticate, async (req, res) => {
  try {
    const comparison = await db.query.comparisons.findFirst({
      where: eq(comparisons.id, req.params.id),
      with: {
        creator: true,
        reviewer: true,
        rows: {
          with: {
            item: true,
          },
        },
      },
    });

    if (!comparison) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    // Get vendors for this comparison
    const compVendors = await db.query.comparisonVendors.findMany({
      where: eq(comparisonVendors.comparisonId, req.params.id),
      with: {
        vendor: true,
      },
    });

    const vendorsList = compVendors.map(cv => cv.vendor);

    res.json({
      ...comparison,
      vendors: vendorsList,
    });
  } catch (error) {
    console.error('Get comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create comparison
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { requestNumber, title, selectedVendors, rows, generalComments, status = 'draft' } = req.body;

    const reqNumber = requestNumber || `REQ-${Date.now()}`;
    const compTitle = title || 'Price Comparison';

    // Create comparison
    const [newComparison] = await db.insert(comparisons).values({
      requestNumber: reqNumber,
      title: compTitle,
      status,
      createdBy: req.user.id,
      generalComments: generalComments || '',
    }).returning();

    // Create comparison rows if provided
    if (rows && rows.length > 0) {
      await db.insert(comparisonRows).values(
        rows.map((row: any, index: number) => ({
          comparisonId: newComparison.id,
          srl: index + 1,
          itemId: row.itemId,
          description: row.description || '',
          qty: row.quantities?.[0] || 0,
          uom: row.uom || 'NOS',
          quantities: row.quantities || [],
          prices: row.prices || [],
          remarks: row.remarks || '',
          comment: row.comment || '',
        }))
      );
    }

    // Create comparison vendors if provided
    if (selectedVendors && selectedVendors.length > 0) {
      await db.insert(comparisonVendors).values(
        selectedVendors.map((vendorId: string, index: number) => ({
          comparisonId: newComparison.id,
          vendorId,
          position: index + 1,
        }))
      );
    }

    // Fetch full comparison with relations
    const fullComparison = await db.query.comparisons.findFirst({
      where: eq(comparisons.id, newComparison.id),
      with: {
        creator: true,
        reviewer: true,
        rows: {
          with: {
            item: true,
          },
        },
      },
    });

    // Get vendors for response
    const compVendors = await db.query.comparisonVendors.findMany({
      where: eq(comparisonVendors.comparisonId, newComparison.id),
      with: {
        vendor: true,
      },
    });

    res.status(201).json({
      ...fullComparison,
      vendors: compVendors.map(cv => cv.vendor),
    });
  } catch (error) {
    console.error('Create comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update comparison
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const { selectedVendors, rows, status, title, requestNumber, generalComments } = req.body;
    const comparisonId = req.params.id;

    // Check if comparison exists
    const existing = await db.query.comparisons.findFirst({
      where: eq(comparisons.id, comparisonId),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    // Update comparison
    const updates: any = {};
    if (title) updates.title = title;
    if (requestNumber) updates.requestNumber = requestNumber;
    if (status) updates.status = status;
    if (generalComments !== undefined) updates.generalComments = generalComments;
    updates.updatedAt = new Date();

    await db.update(comparisons)
      .set(updates)
      .where(eq(comparisons.id, comparisonId));

    // Update vendors if provided
    if (selectedVendors && selectedVendors.length > 0) {
      await db.delete(comparisonVendors).where(eq(comparisonVendors.comparisonId, comparisonId));
      await db.insert(comparisonVendors).values(
        selectedVendors.map((vendorId: string, index: number) => ({
          comparisonId,
          vendorId,
          position: index + 1,
        }))
      );
    }

    // Update rows if provided
    if (rows && rows.length > 0) {
      await db.delete(comparisonRows).where(eq(comparisonRows.comparisonId, comparisonId));
      await db.insert(comparisonRows).values(
        rows.map((row: any, index: number) => ({
          comparisonId,
          srl: index + 1,
          itemId: row.itemId,
          description: row.description || '',
          qty: row.quantities?.[0] || 0,
          uom: row.uom || 'NOS',
          quantities: row.quantities || [],
          prices: row.prices || [],
          remarks: row.remarks || '',
          comment: row.comment || '',
        }))
      );
    }

    // Fetch full comparison with relations
    const updatedComparison = await db.query.comparisons.findFirst({
      where: eq(comparisons.id, comparisonId),
      with: {
        creator: true,
        reviewer: true,
        rows: {
          with: {
            item: true,
          },
        },
      },
    });

    // Get vendors for response
    const compVendors = await db.query.comparisonVendors.findMany({
      where: eq(comparisonVendors.comparisonId, comparisonId),
      with: {
        vendor: true,
      },
    });

    res.json({
      ...updatedComparison,
      vendors: compVendors.map(cv => cv.vendor),
    });
  } catch (error) {
    console.error('Update comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit comparison for review
router.post('/:id/submit', authenticate, async (req: any, res) => {
  try {
    const comparisonId = req.params.id;

    const existing = await db.query.comparisons.findFirst({
      where: eq(comparisons.id, comparisonId),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    if (existing.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft comparisons can be submitted' });
    }

    const [updated] = await db.update(comparisons)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(comparisons.id, comparisonId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Submit comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve comparison (checker/admin only)
router.post('/:id/approve', authenticate, async (req: any, res) => {
  try {
    const comparisonId = req.params.id;
    const user = req.user;

    if (user.role !== 'checker' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only checkers and admins can approve comparisons' });
    }

    const existing = await db.query.comparisons.findFirst({
      where: eq(comparisons.id, comparisonId),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    if (existing.status !== 'submitted') {
      return res.status(400).json({ error: 'Only submitted comparisons can be approved' });
    }

    const [updated] = await db.update(comparisons)
      .set({
        status: 'approved',
        reviewedAt: new Date(),
        reviewedBy: user.id,
        updatedAt: new Date(),
      })
      .where(eq(comparisons.id, comparisonId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Approve comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject comparison (checker/admin only)
router.post('/:id/reject', authenticate, async (req: any, res) => {
  try {
    const comparisonId = req.params.id;
    const { rejectionReason } = req.body;
    const user = req.user;

    if (user.role !== 'checker' && user.role !== 'admin') {
      return res.status(403).json({ error: 'Only checkers and admins can reject comparisons' });
    }

    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const existing = await db.query.comparisons.findFirst({
      where: eq(comparisons.id, comparisonId),
    });

    if (!existing) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    if (existing.status !== 'submitted') {
      return res.status(400).json({ error: 'Only submitted comparisons can be rejected' });
    }

    const [updated] = await db.update(comparisons)
      .set({
        status: 'rejected',
        reviewedAt: new Date(),
        reviewedBy: user.id,
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(comparisons.id, comparisonId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Reject comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete comparison
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comparisonId = req.params.id;

    // Delete related records first
    await db.delete(comparisonRows).where(eq(comparisonRows.comparisonId, comparisonId));
    await db.delete(comparisonVendors).where(eq(comparisonVendors.comparisonId, comparisonId));
    await db.delete(attachments).where(eq(attachments.comparisonId, comparisonId));
    await db.delete(comparisons).where(eq(comparisons.id, comparisonId));

    res.json({ message: 'Comparison deleted successfully' });
  } catch (error) {
    console.error('Delete comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
