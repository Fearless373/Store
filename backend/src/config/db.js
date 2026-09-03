const { MongoClient, ObjectId } = require('mongodb');

let client;
let db;

async function connectDB() {
  if (db) return db;
  client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  // Database name comes from the URI path; falls back to 'provision_store' if none given.
  db = client.db(process.env.MONGODB_DB_NAME || undefined);
  console.log('Connected to MongoDB.');
  return db;
}

function getDB() {
  if (!db) throw new Error('Database not connected yet. Call connectDB() at startup.');
  return db;
}

// Helper: safely parse a route param into an ObjectId, or return null if invalid.
function toObjectId(id) {
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function getClient() {
  if (!client) throw new Error('Database not connected yet. Call connectDB() at startup.');
  return client;
}

module.exports = { connectDB, getDB, getClient, toObjectId, ObjectId };
