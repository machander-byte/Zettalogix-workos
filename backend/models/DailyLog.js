import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema(
  {
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    taskTitle: String,
    minutes: { type: Number, default: 0 }
  },
  { _id: false }
);

const dailyLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    whatDone: { type: String, required: true },
    problems: String,
    tomorrowPlan: String,
    timeSpentPerTask: [timeEntrySchema]
  },
  { timestamps: true }
);

dailyLogSchema.index({ user: 1, createdAt: -1 });

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
export default DailyLog;
