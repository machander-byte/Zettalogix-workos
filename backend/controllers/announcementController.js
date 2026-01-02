import Announcement from '../models/Announcement.js';
import Notification from '../models/Notification.js';
import { recordAuditLog } from '../utils/auditLogger.js';

const ALL_ROLES = ['admin', 'manager', 'employee', 'hr', 'auditor'];

const parseRoles = (value) =>
  value
    ? String(value)
        .split(',')
        .map((role) => role.trim())
        .filter(Boolean)
    : [];

export const listAnnouncements = async (req, res) => {
  const scopeAll = req.user?.role === 'admin' && req.query.scope === 'all';
  const query = scopeAll
    ? {}
    : {
        $or: [
          { targetRoles: { $exists: false } },
          { targetRoles: { $size: 0 } },
          { targetRoles: req.user.role }
        ]
      };

  const announcements = await Announcement.find(query)
    .populate('createdBy', 'name email role')
    .sort({ createdAt: -1 });
  res.json(announcements);
};

export const createAnnouncement = async (req, res) => {
  const { title, body, targetRoles } = req.body;
  if (!title?.trim() || !body?.trim()) {
    return res.status(400).json({ message: 'Title and body are required' });
  }
  const roles = Array.isArray(targetRoles) ? targetRoles : parseRoles(targetRoles);
  const broadcastRoles = roles.length ? roles : ALL_ROLES;

  const announcement = await Announcement.create({
    title: title.trim(),
    body: body.trim(),
    targetRoles: roles,
    createdBy: req.user._id
  });

  await Notification.create({
    targetRoles: broadcastRoles,
    message: title.trim(),
    context: { body: body.trim(), type: 'announcement' },
    severity: 'info'
  });

  await recordAuditLog({
    user: req.user._id,
    role: req.user.role,
    action: 'announcement:create',
    entityType: 'announcement',
    entityId: announcement._id,
    description: `Announcement: ${title.trim()}`,
    metadata: { targetRoles: roles },
    ipAddress: req.ip
  });

  await announcement.populate('createdBy', 'name email role');
  res.status(201).json(announcement);
};
