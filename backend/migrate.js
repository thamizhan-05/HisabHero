import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import 'dotenv/config';

import User from './models/User.js';
import Transaction from './models/Transaction.js';
import Upload from './models/Upload.js';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    // 1. Connect MongoDB
    await connectDB();

    const dataPath = path.join(__dirname, 'data.json');
    const usersPath = path.join(__dirname, 'users.json');

    console.log('👀 Reading JSON file collections...');

    // 2. Load users
    let users = [];
    try {
      users = JSON.parse(await fs.readFile(usersPath, 'utf-8'));
      console.log(`Found ${users.length} users in JSON.`);
    } catch {
      console.log('No users.json found or empty. Skipping.');
    }

    // 3. Load transactions and uploads
    let dbData = { stats: [], transactions: [], uploads: [] };
    try {
      dbData = JSON.parse(await fs.readFile(dataPath, 'utf-8'));
      console.log(`Found ${dbData.transactions?.length || 0} transactions in JSON.`);
      console.log(`Found ${dbData.uploads?.length || 0} uploads in JSON.`);
    } catch {
      console.log('No data.json found or empty. Skipping.');
    }

    // 4. Migrate Users
    if (users.length > 0) {
      console.log('Inserting users...');
      for (const u of users) {
        const existing = await User.findOne({ email: u.email });
        if (!existing) {
          await new User({
            fullName: u.fullName || 'JSON User',
            email: u.email,
            password: u.password,
            companyName: u.companyName
          }).save();
        }
      }
    }

    // 5. Migrate Uploads
    if (dbData.uploads?.length > 0) {
      console.log('Inserting uploads...');
      for (const up of dbData.uploads) {
        const existing = await Upload.findOne({ uploadId: up.id });
        if (!existing) {
          await new Upload({
            uploadId: up.id,
            filename: up.filename || 'Migrated_file',
            uploadedAt: up.uploadedAt,
            rowCount: up.rowCount || 0
          }).save();
        }
      }
    }

    // 6. Migrate Transactions
    if (dbData.transactions?.length > 0) {
      console.log('Inserting transactions...');
      const transactionsToInsert = dbData.transactions.map(tx => ({
        uploadId: tx.uploadId || 'manual',
        date: tx.date || new Date().toISOString().split('T')[0],
        description: tx.description || 'Migrated',
        category: tx.category || 'Other',
        amount: tx.amount || 0,
        type: tx.type || 'expense'
      }));
      await Transaction.insertMany(transactionsToInsert);
    }

    console.log('✅ Migration complete! You can safely delete users.json and data.json.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  }
}

migrate();
