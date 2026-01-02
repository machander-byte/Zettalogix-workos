import mongoose from 'mongoose';

const collabFileSchema = new mongoose.Schema(
  {
    room: { type: String, default: 'strategy' },
    name: { type: String, required: true, trim: true },
    link: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const CollabFile = mongoose.model('CollabFile', collabFileSchema);
export default CollabFile;
