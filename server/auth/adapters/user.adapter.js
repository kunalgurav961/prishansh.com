import mongoose from 'mongoose'

const providerSchema = new mongoose.Schema({
  provider: {
    type: String,
    required: true,
  },
  providerId: {
    type: String,
    required: true,
  },
}, { _id: false })

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 254,
  },
  passwordHash: {
    type: String,
    default: null,
    select: false,
  },
  picture: {
    type: String,
    default: null,
  },
  providers: {
    type: [providerSchema],
    default: [],
  },
}, { timestamps: true })

userSchema.index(
  { 'providers.provider': 1, 'providers.providerId': 1 },
  { unique: true },
)

const User = mongoose.models.User ?? mongoose.model('User', userSchema)

const normalizeEmail = (email) => email.toLowerCase().trim()

const userAdapter = {
  findByProviderId: (provider, providerId) => User.findOne({
    providers: { $elemMatch: { provider, providerId } },
  }),

  findByEmail: (email) => User.findOne({ email: normalizeEmail(email) }),

  findByEmailWithPassword: (email) => User.findOne({ email: normalizeEmail(email) }).select('+passwordHash'),

  create: (userData) => User.create(userData),
  findById: (id) => User.findById(id),
  updateProfile: (id, profile) => User.findByIdAndUpdate(
    id,
    { $set: profile },
    { new: true, runValidators: true },
  ),
  ensureIndexes: () => User.init(),
}

export default userAdapter
