import mongoose from 'mongoose';

const callMessageSchema = new mongoose.Schema(
  {
    call: { type: mongoose.Schema.Types.ObjectId, ref: 'CallSession', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

const CallMessage = mongoose.model('CallMessage', callMessageSchema);
export default CallMessage;
