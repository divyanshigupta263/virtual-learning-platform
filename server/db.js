import { MongoClient } from 'mongodb';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Native MongoDB client and persistent fallback

let db = null;
let client = null;

// Local persistent JSON storage file (ensures zero data loss even if Atlas has IP/network blocks)
const STORAGE_FILE = path.join(__dirname, 'data_storage.json');

const readLocalStorage = () => {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      return JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading local storage:', e.message);
  }
  return { test_results: [], interview_history: [] };
};

const writeLocalStorage = (data) => {
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing local storage:', e.message);
  }
};

/**
 * Connect to MongoDB Atlas
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ MONGODB_URI not found in .env. Running with local persistent storage.');
    return null;
  }

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await client.connect();
    db = client.db();
    console.log(`🍃 Connected to MongoDB Atlas: ${db.databaseName}`);
    return db;
  } catch (error) {
    console.error('⚠️ MongoDB Atlas notice (IP restriction/SSL):', error.message);
    console.log('🛡️ Auto-fallback to local persistent storage active. All records will be saved!');
    return null;
  }
};

export const getDB = () => db;

/**
 * Helper: Save test submission (Always saved locally + synced to Atlas if online)
 */
export const saveTestResult = async (data) => {
  const record = {
    _id: 'rec_' + Date.now() + Math.random().toString(36).substring(2, 6),
    ...data,
    savedAt: new Date().toISOString()
  };

  // 1. Always save to local persistent storage
  const storage = readLocalStorage();
  storage.test_results = [record, ...(storage.test_results || [])];
  writeLocalStorage(storage);

  // 2. Also try MongoDB Atlas if connected
  if (db) {
    try {
      await db.collection('test_results').insertOne(record);
    } catch (err) {
      console.warn('Atlas save notice:', err.message);
    }
  }

  return record;
};

/**
 * Helper: Save AI interview or viva evaluation (Always saved locally + synced to Atlas if online)
 */
export const saveInterviewReport = async (data) => {
  const record = {
    _id: 'rec_' + Date.now() + Math.random().toString(36).substring(2, 6),
    ...data,
    savedAt: new Date().toISOString()
  };

  // 1. Always save to local persistent storage
  const storage = readLocalStorage();
  storage.interview_history = [record, ...(storage.interview_history || [])];
  writeLocalStorage(storage);

  // 2. Also try MongoDB Atlas if connected
  if (db) {
    try {
      await db.collection('interview_history').insertOne(record);
    } catch (err) {
      console.warn('Atlas save notice:', err.message);
    }
  }

  return record;
};

/**
 * Helper: Retrieve test history
 */
export const getTestHistory = async () => {
  if (db) {
    try {
      const records = await db.collection('test_results').find({}).sort({ savedAt: -1 }).toArray();
      if (records && records.length > 0) return records;
    } catch {}
  }
  const storage = readLocalStorage();
  return storage.test_results || [];
};

/**
 * Helper: Retrieve interview & viva history
 */
export const getInterviewHistory = async () => {
  if (db) {
    try {
      const records = await db.collection('interview_history').find({}).sort({ savedAt: -1 }).toArray();
      if (records && records.length > 0) return records;
    } catch {}
  }
  const storage = readLocalStorage();
  return storage.interview_history || [];
};

/**
 * Helper: Clear all test history records
 */
export const clearTestHistory = async () => {
  const storage = readLocalStorage();
  storage.test_results = [];
  writeLocalStorage(storage);
  if (db) {
    try {
      await db.collection('test_results').deleteMany({});
    } catch {}
  }
  return true;
};

/**
 * Helper: Clear all interview & viva records
 */
export const clearInterviewHistory = async () => {
  const storage = readLocalStorage();
  storage.interview_history = [];
  writeLocalStorage(storage);
  if (db) {
    try {
      await db.collection('interview_history').deleteMany({});
    } catch {}
  }
  return true;
};