import { MongoClient } from 'mongodb';

let db = null;
let client = null;

/**
 * Connect to MongoDB Atlas
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.warn('⚠️ MONGODB_URI not found in .env. Running in in-memory mode.');
    return null;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    console.log(`🍃 Connected to MongoDB Atlas: ${db.databaseName}`);
    return db;
  } catch (error) {
    console.error('⚠️ MongoDB Atlas connection notice:', error.message);
    console.log('ℹ️ Server will continue running safely.');
    return null;
  }
};

export const getDB = () => db;

/**
 * Helper: Save test submission to MongoDB
 */
export const saveTestResult = async (data) => {
  if (!db) return null;
  try {
    const collection = db.collection('test_results');
    const result = await collection.insertOne({
      ...data,
      savedAt: new Date()
    });
    return result;
  } catch (err) {
    console.error('Failed to save test result to MongoDB:', err.message);
    return null;
  }
};

/**
 * Helper: Save AI interview or viva evaluation to MongoDB
 */
export const saveInterviewReport = async (data) => {
  if (!db) return null;
  try {
    const collection = db.collection('interview_history');
    const result = await collection.insertOne({
      ...data,
      savedAt: new Date()
    });
    return result;
  } catch (err) {
    console.error('Failed to save interview report to MongoDB:', err.message);
    return null;
  }
};