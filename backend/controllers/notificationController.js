import Notification from '../models/Notification.js';
import NotificationRule from '../models/NotificationRule.js';
import { recordAuditLog } from '../utils/auditLogger.js';

export const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({
    $or: [{ user: req.user._id }, { targetRoles: req.user.role }]
  })
    .sort({ createdAt: -1 })
    .limit(50);
  res.json(notifications);
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOne({
    _id: id,
    $or: [{ user: req.user._id }, { targetRoles: req.user.role }]
  });
  if (!notification) return res.status(404).json({ message: 'Notification not found' });
  notification.readAt = new Date();
  await notification.save();
  res.json(notification);
};

export const listRules = async (req, res) => {
  const rules = await NotificationRule.find().sort({ createdAt: -1 });
  res.json(rules);
};

export const createRule = async (req, res) => {
  const rule = await NotificationRule.create(req.body);
  await recordAuditLog({
    user: req.user._id,
    role: req.user.role,
    action: 'notification_rule:create',
    entityType: 'NotificationRule',
    entityId: rule._id,
    description: `Notification rule ${rule.name} created`,
    metadata: req.body,
    ipAddress: req.ip
  });
  res.status(201).json(rule);
};

export const updateRule = async (req, res) => {
  const { id } = req.params;
  const rule = await NotificationRule.findById(id);
  if (!rule) return res.status(404).json({ message: 'Rule not found' });
  Object.assign(rule, req.body);
  await rule.save();
  await recordAuditLog({
    user: req.user._id,
    role: req.user.role,
    action: 'notification_rule:update',
    entityType: 'NotificationRule',
    entityId: rule._id,
    description: `Notification rule ${rule.name} updated`,
    metadata: req.body,
    ipAddress: req.ip
  });
  res.json(rule);
};

export const deleteRule = async (req, res) => {
  const { id } = req.params;
  const rule = await NotificationRule.findById(id);
  if (!rule) return res.status(404).json({ message: 'Rule not found' });
  await rule.deleteOne();
  await recordAuditLog({
    user: req.user._id,
    role: req.user.role,
    action: 'notification_rule:delete',
    entityType: 'NotificationRule',
    entityId: id,
    description: `Notification rule ${rule.name} deleted`,
    ipAddress: req.ip
  });
  res.json({ success: true });
};
