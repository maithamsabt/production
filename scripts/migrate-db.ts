import { db } from '../server/db';
import { items } from '../server/db/schema';
import { sql } from 'drizzle-orm';

/**
 * Database migration script
 * Adds isVatable column to items table if it doesn't exist
 */
async function migrateDB() {
  try {
    console.log('Starting database migration...');

    // Check if isVatable column exists
    const columnCheck = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'items' 
      AND column_name = 'is_vatable'
    `);

    if (columnCheck.rows.length > 0) {
      console.log('✅ Column is_vatable already exists in items table');
      return;
    }

    // Add isVatable column to items table
    console.log('Adding is_vatable column to items table...');
    await db.execute(sql`
      ALTER TABLE items 
      ADD COLUMN is_vatable BOOLEAN NOT NULL DEFAULT true
    `);

    console.log('✅ Successfully added is_vatable column to items table');

    // Update existing items to be vatable by default
    const result = await db.execute(sql`
      UPDATE items 
      SET is_vatable = true 
      WHERE is_vatable IS NULL
    `);

    console.log(`✅ Updated existing items (${result.rowCount || 0} rows)`);
    console.log('✅ Database migration completed successfully');

  } catch (error) {
    console.error('Error during database migration:', error);
    process.exit(1);
  }
}

migrateDB();
