// Run this file with: npx tsx scripts/run-data-generation.ts

import { generateAllTestData } from './generate-test-data.js';

console.log('Starting user data generation script...');
try {
  await generateAllTestData();
  console.log('Successfully generated 100 users, 50 advisors, and 2 admins.');
  process.exit(0);
} catch (error) {
  console.error('Error running data generation:', error);
  process.exit(1);
}