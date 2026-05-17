import mongoose from 'mongoose';

/**
 * Connects to MongoDB database using environment configurations.
 * Logs connection state or terminates backend if database URI is missing.
 */
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`Successfully connected to MongoDB: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failure: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
