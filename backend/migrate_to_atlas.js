/**
 * Migration script: Local MongoDB → MongoDB Atlas
 * Run with: node migrate_to_atlas.js
 */

const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://localhost:27017/medical-record-system';
const ATLAS_URI = 'mongodb+srv://mongo:mongo@cluster0.r5ixxas.mongodb.net/medical-record-system?retryWrites=true&w=majority&appName=Cluster0';

async function migrate() {
    console.log('🚀 Starting migration: Local → Atlas\n');

    let localClient, atlasClient;

    try {
        // Connect to both
        console.log('📡 Connecting to local MongoDB...');
        localClient = new MongoClient(LOCAL_URI);
        await localClient.connect();
        console.log('✅ Local connected\n');

        console.log('☁️  Connecting to MongoDB Atlas...');
        atlasClient = new MongoClient(ATLAS_URI);
        await atlasClient.connect();
        console.log('✅ Atlas connected\n');

        const localDb = localClient.db('medical-record-system');
        const atlasDb = atlasClient.db('medical-record-system');

        // Get all collections from local
        const collections = await localDb.listCollections().toArray();
        console.log(`📋 Found ${collections.length} collections to migrate:\n`);

        for (const collectionInfo of collections) {
            const collName = collectionInfo.name;
            const localCol = localDb.collection(collName);
            const atlasCol = atlasDb.collection(collName);

            const docs = await localCol.find({}).toArray();

            if (docs.length === 0) {
                console.log(`  ⚠️  [${collName}] — empty, skipping`);
                continue;
            }

            // Drop existing Atlas collection before inserting (clean slate)
            await atlasCol.drop().catch(() => {}); // ignore error if doesn't exist

            await atlasCol.insertMany(docs);
            console.log(`  ✅ [${collName}] — migrated ${docs.length} documents`);
        }

        console.log('\n🎉 Migration complete! All data is now on Atlas.');
        console.log('   You can log in with your existing credentials.\n');

    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        if (err.message.includes('ECONNREFUSED')) {
            console.error('   → Local MongoDB is not running. Start it first with: mongod');
        }
    } finally {
        if (localClient) await localClient.close();
        if (atlasClient) await atlasClient.close();
    }
}

migrate();
