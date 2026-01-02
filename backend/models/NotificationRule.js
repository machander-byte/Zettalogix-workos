import mongoose from 'mongoose';

const notificationRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    eventType: { type: String, required: true },
    condition: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    targetRoles: [{ type: String, required: true }],
    active: { type: Boolean, default: true },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'warning'
    }
  },
  { timestamps: true }
);

notificationRuleSchema.index({ eventType: 1, active: 1 });

const NotificationRule = mongoose.model('NotificationRule', notificationRuleSchema);
export default NotificationRule;
