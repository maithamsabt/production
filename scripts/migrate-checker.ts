import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * Database migration script
 * Adds/verifies checker functionality fields to comparisons table
 * Run with: npm run db:migrate-checker
 */
async function migrateCheckerFunctionality() {
  try {
    console.log('Starting checker functionality migration...');
    console.log('');

    // List of columns to check/add
    const columns = [
      { name: 'submitted_at', type: 'TIMESTAMP', definition: 'ALTER TABLE comparisons ADD COLUMN submitted_at TIMESTAMP' },
      { name: 'reviewed_at', type: 'TIMESTAMP', definition: 'ALTER TABLE comparisons ADD COLUMN reviewed_at TIMESTAMP' },
      { name: 'reviewed_by', type: 'UUID REFERENCES users(id)', definition: 'ALTER TABLE comparisons ADD COLUMN reviewed_by UUID REFERENCES users(id)' },
      { name: 'rejection_reason', type: 'TEXT', definition: 'ALTER TABLE comparisons ADD COLUMN rejection_reason TEXT' },
      { name: 'general_comments', type: 'TEXT', definition: 'ALTER TABLE comparisons ADD COLUMN general_comments TEXT' },
    ];

    let addedCount = 0;

    for (const column of columns) {
      try {
        const columnCheck = await db.execute(sql`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'comparisons' 
          AND column_name = ${column.name}
        `);

        if (columnCheck.rows.length === 0) {
          console.log(`Adding ${column.name} (${column.type})...`);
          await db.execute(sql.raw(column.definition));
          console.log(`✅ Added ${column.name} column`);
          addedCount++;
        } else {
          console.log(`✅ ${column.name} column already exists`);
        }
      } catch (error: any) {
        // Column might already exist or there's a different issue
        console.log(`⚠️  Skipping ${column.name}: ${error.message}`);
      }
    }

    console.log('');
    console.log('✅ Database migration for checker functionality completed successfully');
    console.log(`Added/Updated ${addedCount} column(s)`);
    console.log('');
    console.log('The comparisons table now supports:');
    console.log('  - submitted_at: When a comparison was submitted for review');
    console.log('  - reviewed_at: When a comparison was reviewed (approved/rejected)');
    console.log('  - reviewed_by: Which user (checker/admin) reviewed it');
    console.log('  - rejection_reason: Why it was rejected (if applicable)');
    console.log('  - general_comments: General comments on the comparison');

  } catch (error) {
    console.error('Error during database migration:', error);
    process.exit(1);
  }
}

migrateCheckerFunctionality();
