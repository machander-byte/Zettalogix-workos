import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState >= 1) return;

    const targetUri = process.env.MONGO_URI;

    if (!targetUri || targetUri === 'memory') {
      memoryServer = await MongoMemoryServer.create();
      await mongoose.connect(memoryServer.getUri(), { dbName: 'workhub' });
      console.log('MongoDB connected (in-memory)');
    } else {
      await mongoose.connect(targetUri, { dbName: 'workhub' });
      console.log('MongoDB connected');
    }
  } catch (error) {
    console.error('Mongo connection error:', error.message);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
  }
  process.exit(0);
});

export default connectDB;
