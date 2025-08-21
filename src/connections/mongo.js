import mongoose from 'mongoose';

const mongodb_uri = process.env.MONGODB;
const database_name = process.env.DATABASE_NAME;

let is_connected = false;

export async function connect_mongoose() {
  try {
    if (is_connected) {
      console.log('🟢 Mongoose already connected');
      return;
    }

    if (!mongodb_uri) {
      throw new Error('Missing MONGODB environment variable');
    }

    if (!database_name) {
      throw new Error('Missing DATABASE_NAME environment variable');
    }

    await mongoose.connect(mongodb_uri, {
      dbName: database_name,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    is_connected = true;
    console.log('🟢 Mongoose connected successfully to MongoDB');
    console.log(`📍 Database: ${database_name}`);

  } catch (error) {
    console.error('🔴 Failed to connect mongoose to MongoDB:', error.message);
    throw error;
  }
}

export async function disconnect_mongoose() {
  try {
    if (!is_connected) {
      return;
    }

    await mongoose.disconnect();
    is_connected = false;
    console.log('🟡 Mongoose disconnected from MongoDB');

  } catch (error) {
    console.error('🔴 Failed to disconnect mongoose:', error.message);
  }
}

export function get_mongoose_connection_status() {
  return {
    is_connected,
    ready_state: mongoose.connection.readyState,
    database_name: mongoose.connection.db?.databaseName,
    host: mongoose.connection.host,
    port: mongoose.connection.port
  };
}

mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connection established');
});

mongoose.connection.on('error', (error) => {
  console.error('🔴 Mongoose connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected');
  is_connected = false;
});

process.on('SIGINT', async () => {
  await disconnect_mongoose();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnect_mongoose();
  process.exit(0);
});