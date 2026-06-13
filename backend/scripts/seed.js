/**
 * ============================================================
 *  DEV ONLY — DO NOT RUN IN PRODUCTION
 *  Seeds the database with sample admin and user accounts.
 *  Run with: node backend/scripts/seed.js
 * ============================================================
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: Seed script must not be run in production.');
  process.exit(1);
}

const seedUsers = async () => {
  try {
    await connectDB();

    const users = [
      { name: 'Super Admin', email: 'admin@seo.com',    password: 'password123', role: 'admin', credits: 9999 },
      { name: 'John Doe',    email: 'john@example.com', password: 'password123', role: 'user',  credits: 10   },
      { name: 'Jane Smith',  email: 'jane@example.com', password: 'password123', role: 'user',  credits: 5    },
      { name: 'Bob Test',    email: 'bob@example.com',  password: 'password123', role: 'user',  credits: 0    },
    ];

    for (const userData of users) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        await User.create(userData);
        console.log(`Created: ${userData.email} (${userData.role})`);
      } else {
        console.log(`Skipped (already exists): ${userData.email}`);
      }
    }

    console.log('Database seeded successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedUsers();
