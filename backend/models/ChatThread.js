import mongoose from 'mongoose';

const chatThreadSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    type: { type: String, enum: ['direct', 'room'], default: 'direct' },
    topic: { type: String, trim: true },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

chatThreadSchema.index({ participants: 1 });

const ChatThread = mongoose.model('ChatThread', chatThreadSchema);
export default ChatThread;
