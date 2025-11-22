import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * Database reset script for comparison data
 * Removes all comparison-related data while preserving users, items, and vendors
 * Run with: npm run db:reset-comparisons
 */
async function resetComparisons() {
  try {
    console.log('Starting comparison data reset...');
    console.log('⚠️  WARNING: This will delete ALL comparison data!');
    console.log('');

    // Delete all comparison-related data in correct order (respecting foreign keys)
    console.log('Deleting attachments...');
    const attachmentsResult = await db.execute(sql`DELETE FROM attachments`);
    console.log(`✅ Deleted ${attachmentsResult.rowCount || 0} attachment(s)`);

    console.log('Deleting comparison rows...');
    const rowsResult = await db.execute(sql`DELETE FROM comparison_rows`);
    console.log(`✅ Deleted ${rowsResult.rowCount || 0} comparison row(s)`);

    console.log('Deleting comparison vendors...');
    const vendorsResult = await db.execute(sql`DELETE FROM comparison_vendors`);
    console.log(`✅ Deleted ${vendorsResult.rowCount || 0} comparison vendor(s)`);

    console.log('Deleting comparisons...');
    const comparisonsResult = await db.execute(sql`DELETE FROM comparisons`);
    console.log(`✅ Deleted ${comparisonsResult.rowCount || 0} comparison(s)`);

    console.log('');
    console.log('✅ Comparison data reset completed successfully!');
    console.log('');
    console.log('Preserved data:');
    console.log('  - Users');
    console.log('  - Items');
    console.log('  - Vendors');
    console.log('  - Settings');
    console.log('');
    console.log('You can now create fresh comparisons.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during comparison data reset:', error);
    process.exit(1);
  }
}

resetComparisons();
