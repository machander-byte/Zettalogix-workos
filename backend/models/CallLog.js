import mongoose from 'mongoose';

const callLogSchema = new mongoose.Schema(
  {
    callId: { type: String, required: true },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['audio', 'video'], required: true },
    status: { type: String, enum: ['missed', 'answered', 'rejected', 'cancelled'], required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    durationSec: { type: Number, default: 0 }
  },
  { timestamps: true }
);

callLogSchema.index({ fromUserId: 1, toUserId: 1, startedAt: -1 });

const CallLog = mongoose.model('CallLog', callLogSchema);
export default CallLog;
