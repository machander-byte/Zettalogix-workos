import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, required: true },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    description: String,
    metadata: mongoose.Schema.Types.Mixed,
    ipAddress: String
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false }
  }
);

// Prevent direct updates to preserve immutability
auditLogSchema.pre(['updateOne', 'findOneAndUpdate', 'updateMany'], function disallowUpdate(next) {
  next(new Error('AuditLog entries are immutable.'));
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
