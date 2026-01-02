import mongoose from 'mongoose';

const activityAlertSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['idle_soft', 'idle_admin', 'offline_work_hours', 'active_outside'],
      required: true
    },
    message: { type: String, required: true },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    metadata: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

const ActivityAlert = mongoose.model('ActivityAlert', activityAlertSchema);
export default ActivityAlert;
