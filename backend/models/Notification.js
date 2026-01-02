import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    targetRoles: [{ type: String }],
    message: { type: String, required: true },
    context: mongoose.Schema.Types.Mixed,
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info'
    },
    rule: { type: mongoose.Schema.Types.ObjectId, ref: 'NotificationRule' },
    readAt: Date
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, readAt: 1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
