import ActivityAlert from '../models/ActivityAlert.js';

export const listAlerts = async (req, res) => {
  const limit = Number(req.query.limit || 20);
  const alerts = await ActivityAlert.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'name email role');
  res.json(alerts);
};
