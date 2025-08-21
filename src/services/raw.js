import { connectToDatabase } from '../database.js';

const allowed_collections = [
  'members',
  'raid-team',
  'raid_progress',
  'settings',
  'season3_data'
];

export async function get_raw_collection_data(collection_name) {
  try {
    if (!collection_name) {
      throw new Error('Collection name is required');
    }

    if (!allowed_collections.includes(collection_name)) {
      throw new Error(`Collection '${collection_name}' is not allowed. Allowed collections: ${allowed_collections.join(', ')}`);
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(collection_name);
    
    const documents = await collection.find({}).toArray();
    
    console.log(`📋 Retrieved ${documents.length} documents from collection: ${collection_name}`);
    
    return {
      collection: collection_name,
      count: documents.length,
      documents: documents
    };
    
  } catch (error) {
    console.error(`❌ Failed to get raw data from collection ${collection_name}:`, error);
    throw error;
  }
}

export function get_allowed_collections() {
  return allowed_collections;
}