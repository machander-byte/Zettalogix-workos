import ActivityAlert from '../models/ActivityAlert.js';
import { createNotification } from './notificationService.js';

export const logAlert = async ({
  userId,
  type,
  severity,
  message,
  metadata = {}
}) => {
  const alert = await ActivityAlert.create({
    user: userId,
    type,
    severity,
    message,
    metadata
  });
  await createNotification({
    user: userId,
    targetRoles: ['admin', 'manager'],
    message,
    severity,
    context: { alertId: alert._id, type, ...metadata }
  });
  return alert;
};
