import Notification from '../models/Notification.js';
import NotificationRule from '../models/NotificationRule.js';

export const createNotification = async ({ user, targetRoles = [], message, severity, context, rule }) =>
  Notification.create({
    user,
    targetRoles,
    message,
    severity,
    context,
    rule
  });

const handlers = {
  idle_threshold: async ({ payload }) => {
    const rules = await NotificationRule.find({ eventType: 'idle_threshold', active: true });
    await Promise.all(
      rules.map(async (rule) => {
        const threshold = Number(rule.condition?.minutes || 0);
        if (payload.idleMinutes >= threshold) {
          await createNotification({
            user: rule.targetRoles.includes(payload.role) ? payload.user : undefined,
            targetRoles: rule.targetRoles,
            message: `Idle threshold exceeded by ${payload.userName} (${payload.idleMinutes}m)`,
            severity: rule.severity,
            context: payload,
            rule: rule._id
          });
        }
      })
    );
  }
};

export const dispatchRuleEvent = async (eventType, payload) => {
  const handler = handlers[eventType];
  if (!handler) return;
  await handler({ payload });
};
