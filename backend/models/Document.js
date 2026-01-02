import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    description: String,
    tags: [String],
    mimeType: String,
    size: Number,
    accessRoles: [{ type: String }],
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const Document = mongoose.model('Document', documentSchema);
export default Document;
