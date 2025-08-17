// Suppress ExperimentalWarning
process.removeAllListeners('warning');

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import figlet from 'figlet';
import gradient from 'gradient-string';

import { 
  connectToDatabase,
  closeDatabase
} from '../../src/database.js';

// Load config
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configPath = join(__dirname, '../../app.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Display warning
console.log(gradient.pastel.multiline(figlet.textSync('MongoDB Wipe', {
    horizontalLayout: 'full'
})));
console.log(gradient.cristal.multiline('⚠️  DANGEROUS OPERATION ⚠️'));
console.log(gradient.morning('This will DELETE ALL guild member data from MongoDB\n'));

/**
 * Wipes the MongoDB members collection
 */
async function wipeMongoDBData() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        const { db } = await connectToDatabase();
        
        const membersCollectionName = process.env.MEMBERS_COLLECTION_NAME;
        if (!membersCollectionName) {
            throw new Error('MEMBERS_COLLECTION_NAME environment variable not set');
        }
        
        const membersCollection = db.collection(membersCollectionName);
        
        // Get current count
        const currentCount = await membersCollection.countDocuments();
        console.log(`📊 Current members in collection: ${currentCount}`);
        
        if (currentCount === 0) {
            console.log('✅ Collection is already empty, nothing to wipe');
            return;
        }
        
        // Ask for confirmation
        console.log(`\n⚠️  This will DELETE ${currentCount} member records from collection: ${membersCollectionName}`);
        console.log('⚠️  This action is IRREVERSIBLE');
        console.log('\n💡 To proceed, you must set CONFIRM_WIPE=true environment variable');
        
        if (process.env.CONFIRM_WIPE !== 'true') {
            console.log('❌ Wipe cancelled - CONFIRM_WIPE not set to true');
            console.log('\n🔧 To confirm wipe, run:');
            console.log('   CONFIRM_WIPE=true node tools/scripts/wipeMongoDB.mjs');
            return;
        }
        
        console.log('\n🗑️  Proceeding with wipe...');
        
        // Delete all documents
        const deleteResult = await membersCollection.deleteMany({});
        
        console.log(`✅ Successfully deleted ${deleteResult.deletedCount} member records`);
        console.log('🧹 MongoDB members collection has been wiped clean');
        
        // Verify collection is empty
        const finalCount = await membersCollection.countDocuments();
        console.log(`📊 Final member count: ${finalCount}`);
        
        console.log('\n🔄 Next steps:');
        console.log('1. Run guild update to collect fresh data:');
        console.log('   curl -X POST http://localhost:8000/update');
        console.log('2. Data will be processed with current Season 3 configuration');
        console.log('3. Enchant counts will be accurate for Season 3 (no HEAD enchants)');
        
    } catch (error) {
        console.error('❌ Failed to wipe MongoDB:', error.message);
        throw error;
    }
}

/**
 * Main execution
 */
async function main() {
    try {
        await wipeMongoDBData();
    } catch (error) {
        console.error('💥 Wipe operation failed:', error);
        process.exit(1);
    } finally {
        await closeDatabase();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

// Run the wipe
main().catch(error => {
    console.error('💥 Script crashed:', error);
    process.exit(1);
});