import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { user } from './schema';
import { generateHashedPassword } from './utils';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function createDefaultAdmin() {
  try {
    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(user)
      .where(eq(user.role, 'admin'))
      .limit(1);

    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return existingAdmin;
    }

    // Create default admin
    const adminEmail = 'admin@immai.me';
    const adminPassword = 'admin123'; // Change this in production
    const hashedPassword = generateHashedPassword(adminPassword);

    const [newAdmin] = await db
      .insert(user)
      .values({
        email: adminEmail,
        password: hashedPassword,
        name: 'System Administrator',
        role: 'admin',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

    console.log('Default admin created successfully:', {
      email: adminEmail,
      password: adminPassword,
      ...newAdmin
    });

    return newAdmin;
  } catch (error) {
    console.error('Failed to create default admin:', error);
    throw error;
  }
}