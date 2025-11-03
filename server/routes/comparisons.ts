import { Router } from 'express';
import { db } from '../db';
import { comparisons, comparisonRows, comparisonVendors, attachments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all comparisons
router.get('/', authenticate, async (req, res) => {
  try {
    const allComparisons = await db.query.comparisons.findMany({
      orderBy: (comparisons, { desc }) => [desc(comparisons.createdAt)],
      with: {
        comparisonVendors: {
          with: {
            vendor: true,
          },
        },
        comparisonRows: {
          with: {
            item: true,
          },
        },
        attachments: true,
      },
    });

    res.json(allComparisons);
  } catch (error) {
    console.error('Get comparisons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get comparison by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const comparison = await db.query.comparisons.findFirst({
      where: eq(comparisons.id, req.params.id),
      with: {
        comparisonVendors: {
          with: {
            vendor: true,
          },
        },
        comparisonRows: {
          with: {
            item: true,
          },
        },
        attachments: true,
      },
    });

    if (!comparison) {
      return res.status(404).json({ error: 'Comparison not found' });
    }

    res.json(comparison);
  } catch (error) {
    console.error('Get comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create comparison
router.post('/', authenticate, async (req: any, res) => {
  try {
    const { projectName, projectNumber, selectedVendors, rows, status = 'draft' } = req.body;

    if (!projectName || !selectedVendors || !rows) {
      return res.status(400).json({ error: 'Project name, vendors, and rows are required' });
    }

    // Create comparison
    const [newComparison] = await db.insert(comparisons).values({
      projectName,
      projectNumber,
      status,
      createdBy: req.user.id,
    }).returning();

    // Create comparison vendors
    await db.insert(comparisonVendors).values(
      selectedVendors.map((vendorId: string) => ({
        comparisonId: newComparison.id,
        vendorId,
      }))
    );

    // Create comparison rows
    await db.insert(comparisonRows).values(
      rows.map((row: any) => ({
        comparisonId: newComparison.id,
        itemId: row.itemId,
        quantity: row.quantity,
        vendorPrices: row.vendorPrices || {},
      }))
    );

    // Fetch full comparison with relations
    const fullComparison = await db.query.comparisons.findFirst({
      where: eq(comparisons.id, newComparison.id),
      with: {
        comparisonVendors: {
          with: {
            vendor: true,
          },
        },
        comparisonRows: {
          with: {
            item: true,
          },
        },
      },
    });

    res.status(201).json(fullComparison);
  } catch (error) {
    console.error('Create comparison error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update comparison
router.put('/:id', authenticate, async (req: any, res) => {
  try {
    const { projectName, projectNumber, selectedVendors, rows, status, selectedVendor } = req.body;
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
    if (projectName) updates.projectName = projectName;
    if (projectNumber) updates.projectNumber = projectNumber;
    if (status) updates.status = status;
    if (selectedVendor) updates.selectedVendor = selectedVendor;

    await db.update(comparisons)
      .set(updates)
      .where(eq(comparisons.id, comparisonId));

    // Update vendors if provided
    if (selectedVendors) {
      await db.delete(comparisonVendors).where(eq(comparisonVendors.comparisonId, comparisonId));
      await db.insert(comparisonVendors).values(
        selectedVendors.map((vendorId: string) => ({
          comparisonId,
          vendorId,
        }))
      );
    }

    // Update rows if provided
    if (rows) {
      await db.delete(comparisonRows).where(eq(comparisonRows.comparisonId, comparisonId));
      await db.insert(comparisonRows).values(
        rows.map((row: any) => ({
          comparisonId,
          itemId: row.itemId,
          quantity: row.quantity,
          vendorPrices: row.vendorPrices || {},
        }))
      );
    }

    // Fetch full comparison with relations
    const updatedComparison = await db.query.comparisons.findFirst({
      where: eq(comparisons.id, comparisonId),
      with: {
        comparisonVendors: {
          with: {
            vendor: true,
          },
        },
        comparisonRows: {
          with: {
            item: true,
          },
        },
        attachments: true,
      },
    });

    res.json(updatedComparison);
  } catch (error) {
    console.error('Update comparison error:', error);
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
