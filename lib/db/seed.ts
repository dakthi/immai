#!/usr/bin/env tsx

import { config } from 'dotenv';

// Load .env.local file explicitly
config({ path: '.env.local' });
import { createDefaultAdmin } from './seed-queries';

async function main() {
  console.log('🌱 Seeding database...');
  
  try {
    await createDefaultAdmin();
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();