import mongoose from 'mongoose';

const collabMessageSchema = new mongoose.Schema(
  {
    room: { type: String, default: 'strategy' },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    body: { type: String, required: true }
  },
  { timestamps: true }
);

const CollabMessage = mongoose.model('CollabMessage', collabMessageSchema);
export default CollabMessage;
