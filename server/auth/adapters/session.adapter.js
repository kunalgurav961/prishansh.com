import mongoose from 'mongoose'

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true })

sessionSchema.index({ tokenHash: 1 }, { unique: true })
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const Session = mongoose.models.Session ?? mongoose.model('Session', sessionSchema)

const sessionAdapter = {
  create: (data) => Session.create(data),
  findByTokenHash: (tokenHash) => Session.findOne({ tokenHash }),
  rotateByTokenHash: ({ tokenHash, newTokenHash, userId, expiresAt }) => Session.findOneAndUpdate(
    { tokenHash, userId, expiresAt: { $gt: new Date() } },
    { $set: { tokenHash: newTokenHash, expiresAt } },
    { new: true },
  ),
  deleteByTokenHash: (tokenHash) => Session.deleteOne({ tokenHash }),
  deleteByUserId: (userId) => Session.deleteMany({ userId }),
  ensureIndexes: () => Session.init(),
}

export default sessionAdapter
