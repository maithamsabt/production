import bcrypt from 'bcryptjs';
import { db } from '../server/db';
import { users } from '../server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Initialize database with admin user
 * Run this script once after deploying to Vercel
 */
async function initDB() {
  try {
    console.log('Initializing database...');

    const adminUsername = process.env.VITE_ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.VITE_ADMIN_PASSWORD || 'admin123';

    // Check if admin exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(users.role, 'admin'),
    });

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const [admin] = await db.insert(users).values({
      username: adminUsername,
      passwordHash,
      role: 'admin',
      name: 'System Administrator',
      isActive: true,
    }).returning();

    console.log('✅ Admin user created successfully:', admin.username);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDB();
