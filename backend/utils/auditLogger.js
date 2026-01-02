import AuditLog from '../models/AuditLog.js';

export const recordAuditLog = async ({
  user,
  role,
  action,
  entityType,
  entityId,
  description,
  metadata,
  ipAddress
}) => {
  try {
    await AuditLog.create({
      user,
      role,
      action,
      entityType,
      entityId,
      description,
      metadata,
      ipAddress
    });
  } catch (error) {
    console.error('Failed to record audit log', error.message);
  }
};

export const fetchRecentAuditLogs = async (filters = {}, limit = 20) =>
  AuditLog.find(filters)
    .populate('user', 'name email role')
    .sort({ timestamp: -1 })
    .limit(limit);
