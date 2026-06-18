import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('CRITICAL ERROR: MONGODB_URI is not defined in the environment variables.');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('Initiating new MongoDB connection...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      console.log(`Successfully connected to MongoDB: ${mongoose.connection.host}`);
      try {
        await mongoose.connection.collection('settings').updateOne({}, { $set: { openaiApiKey: "" } });
        console.log("Cleared old openaiApiKey from DB settings to force fallback to ENV var");
      } catch (e) {
        console.error("Failed to clear key from DB", e);
      }
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error(`MongoDB connection failure: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

export default connectDB;
