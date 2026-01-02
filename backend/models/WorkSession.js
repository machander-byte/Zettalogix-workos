import mongoose from 'mongoose';

const pageSchema = new mongoose.Schema(
  {
    url: String,
    title: String,
    duration: { type: Number, default: 0 },
    lastVisited: { type: Date, default: Date.now }
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const workSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    startAt: { type: Date },
    endTime: Date,
    endAt: Date,
    idleTime: { type: Number, default: 0 },
    activeMs: { type: Number, default: 0 },
    idleMs: { type: Number, default: 0 },
    lastTickAt: { type: Date },
    focusScore: { type: Number, default: 0 },
    activePages: [pageSchema],
    tabSwitchCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'paused', 'stopped'], default: 'active' },
    events: [eventSchema]
  },
  { timestamps: true }
);

workSessionSchema.index({ user: 1, status: 1 });

const WorkSession = mongoose.model('WorkSession', workSessionSchema);
export default WorkSession;
