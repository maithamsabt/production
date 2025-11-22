import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../server/db/index.js';
import { comparisons, comparisonRows, comparisonVendors, attachments } from '../server/db/schema.js';
import { eq } from 'drizzle-orm';
import { authenticate, handleError, authorize } from './_middleware/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const user = authenticate(req);
    const id = req.query.id as string | undefined;
    const action = req.query.action as string | undefined;

    // GET /api/comparisons - Get all comparisons
    if (req.method === 'GET' && !id) {
      let allComparisons;

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

      return res.status(200).json(allComparisons);
    }

    // GET /api/comparisons?id=xxx - Get comparison by ID
    if (req.method === 'GET' && id) {
      const comparison = await db.query.comparisons.findFirst({
        where: eq(comparisons.id, id),
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

      const compVendors = await db.query.comparisonVendors.findMany({
        where: eq(comparisonVendors.comparisonId, id),
        with: {
          vendor: true,
        },
      });

      const vendorsList = compVendors.map(cv => cv.vendor);

      return res.status(200).json({
        ...comparison,
        vendors: vendorsList,
      });
    }

    // POST /api/comparisons - Create comparison
    if (req.method === 'POST' && !id) {
      const { requestNumber, title, selectedVendors, rows, generalComments, status = 'draft' } = req.body;

      const reqNumber = requestNumber || `REQ-${Date.now()}`;
      const compTitle = title || 'Price Comparison';

      const [newComparison] = await db.insert(comparisons).values({
        requestNumber: reqNumber,
        title: compTitle,
        status,
        createdBy: user.id,
        generalComments: generalComments || '',
      }).returning();

      if (rows && rows.length > 0) {
        const validRows = rows.filter((row: any) => row.itemId && row.itemId.trim() !== '');
        if (validRows.length > 0) {
          await db.insert(comparisonRows).values(
            validRows.map((row: any, index: number) => ({
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
      }

      if (selectedVendors && selectedVendors.length > 0) {
        await db.insert(comparisonVendors).values(
          selectedVendors.map((vendorId: string, index: number) => ({
            comparisonId: newComparison.id,
            vendorId,
            position: index + 1,
          }))
        );
      }

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

      const compVendors = await db.query.comparisonVendors.findMany({
        where: eq(comparisonVendors.comparisonId, newComparison.id),
        with: {
          vendor: true,
        },
      });

      return res.status(201).json({
        ...fullComparison,
        vendors: compVendors.map(cv => cv.vendor),
      });
    }

    // PUT /api/comparisons?id=xxx - Update comparison
    if (req.method === 'PUT' && id && !action) {
      const { selectedVendors, rows, status, title, requestNumber, generalComments } = req.body;

      const existing = await db.query.comparisons.findFirst({
        where: eq(comparisons.id, id),
      });

      if (!existing) {
        return res.status(404).json({ error: 'Comparison not found' });
      }

      const updates: any = {};
      if (title) updates.title = title;
      if (requestNumber) updates.requestNumber = requestNumber;
      if (status) updates.status = status;
      if (generalComments !== undefined) updates.generalComments = generalComments;
      updates.updatedAt = new Date();

      await db.update(comparisons)
        .set(updates)
        .where(eq(comparisons.id, id));

      if (selectedVendors && selectedVendors.length > 0) {
        await db.delete(comparisonVendors).where(eq(comparisonVendors.comparisonId, id));
        await db.insert(comparisonVendors).values(
          selectedVendors.map((vendorId: string, index: number) => ({
            comparisonId: id,
            vendorId,
            position: index + 1,
          }))
        );
      }

      if (rows && rows.length > 0) {
        await db.delete(comparisonRows).where(eq(comparisonRows.comparisonId, id));
        const validRows = rows.filter((row: any) => row.itemId && row.itemId.trim() !== '');
        if (validRows.length > 0) {
          await db.insert(comparisonRows).values(
            validRows.map((row: any, index: number) => ({
              comparisonId: id,
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
      }

      const updatedComparison = await db.query.comparisons.findFirst({
        where: eq(comparisons.id, id),
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

      const compVendors = await db.query.comparisonVendors.findMany({
        where: eq(comparisonVendors.comparisonId, id),
        with: {
          vendor: true,
        },
      });

      return res.status(200).json({
        ...updatedComparison,
        vendors: compVendors.map(cv => cv.vendor),
      });
    }

    // POST /api/comparisons?id=xxx&action=submit - Submit comparison
    if (req.method === 'POST' && id && action === 'submit') {
      const existing = await db.query.comparisons.findFirst({
        where: eq(comparisons.id, id),
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
        .where(eq(comparisons.id, id))
        .returning();

      return res.status(200).json(updated);
    }

    // POST /api/comparisons?id=xxx&action=approve - Approve comparison
    if (req.method === 'POST' && id && action === 'approve') {
      if (user.role !== 'checker' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Only checkers and admins can approve comparisons' });
      }

      const existing = await db.query.comparisons.findFirst({
        where: eq(comparisons.id, id),
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
        .where(eq(comparisons.id, id))
        .returning();

      return res.status(200).json(updated);
    }

    // POST /api/comparisons?id=xxx&action=reject - Reject comparison
    if (req.method === 'POST' && id && action === 'reject') {
      const { rejectionReason } = req.body;

      if (user.role !== 'checker' && user.role !== 'admin') {
        return res.status(403).json({ error: 'Only checkers and admins can reject comparisons' });
      }

      if (!rejectionReason) {
        return res.status(400).json({ error: 'Rejection reason is required' });
      }

      const existing = await db.query.comparisons.findFirst({
        where: eq(comparisons.id, id),
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
        .where(eq(comparisons.id, id))
        .returning();

      return res.status(200).json(updated);
    }

    // DELETE /api/comparisons?id=xxx - Delete comparison
    if (req.method === 'DELETE' && id) {
      await db.delete(comparisonRows).where(eq(comparisonRows.comparisonId, id));
      await db.delete(comparisonVendors).where(eq(comparisonVendors.comparisonId, id));
      await db.delete(attachments).where(eq(attachments.comparisonId, id));
      await db.delete(comparisons).where(eq(comparisons.id, id));

      return res.status(200).json({ message: 'Comparison deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    handleError(error, res);
  }
}
