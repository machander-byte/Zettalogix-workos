import mongoose from 'mongoose';

const callSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    scheduledFor: { type: Date },
    channel: { type: String, default: 'WorkHub Voice Room' },
    attendees: [{ type: String }],
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled'
    },
    host: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    startTime: Date,
    endTime: Date
  },
  { timestamps: true }
);

const CallSession = mongoose.model('CallSession', callSessionSchema);
export default CallSession;
