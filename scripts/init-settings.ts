import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { settings } from '../server/db/schema';
import * as schema from '../server/db/schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function initSettings() {
  console.log('Initializing settings table...');

  try {
    // Check if settings already exist
    const existingSettings = await db.query.settings.findFirst();

    if (existingSettings) {
      console.log('✓ Settings already exist:', existingSettings);
      return;
    }

    // Create default settings
    const [newSettings] = await db.insert(settings).values({
      companyName: 'Your Company Name',
      companyAddress: 'Your Company Address',
      companyPhone: '+1234567890',
      companyEmail: 'info@company.com',
      defaultVat: '10',
      checkerSignature: null,
    }).returning();

    console.log('✓ Default settings created successfully:', newSettings);
  } catch (error) {
    console.error('✗ Error initializing settings:', error);
    throw error;
  }
}

initSettings()
  .then(() => {
    console.log('Settings initialization completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Settings initialization failed:', error);
    process.exit(1);
  });
