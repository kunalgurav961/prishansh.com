import mongoose from 'mongoose'

const connectDB = async (uri) => {
  if (!uri) throw new Error('Missing required configuration: MONGODB_URI')

  await mongoose.connect(uri)
  console.log('MongoDB connected successfully')
}

export default connectDB
