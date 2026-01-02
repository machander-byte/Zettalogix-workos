import CallSession from '../models/CallSession.js';
import CallMessage from '../models/CallMessage.js';
import CallLog from '../models/CallLog.js';
import { respondIfInvalidObjectId } from '../utils/objectId.js';

export const listCalls = async (req, res) => {
  const calls = await CallSession.find()
    .populate('host', 'name email')
    .sort({ scheduledFor: 1, createdAt: -1 });
  res.json(calls);
};

export const createCall = async (req, res) => {
  const { title, scheduledFor, attendees = [], channel } = req.body;
  if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });

  const session = await CallSession.create({
    title: title.trim(),
    scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    attendees,
    channel: channel?.trim() || 'WorkHub Voice Room',
    host: req.user._id
  });

  await session.populate('host', 'name email');
  res.status(201).json(session);
};

export const startCall = async (req, res) => {
  const { id } = req.params;
  if (respondIfInvalidObjectId(res, id, 'call id')) return;
  const session = await CallSession.findById(id);
  if (!session) return res.status(404).json({ message: 'Call not found' });
  if (session.status === 'ended')
    return res.status(400).json({ message: 'Call already ended' });

  session.status = 'live';
  session.startTime = new Date();
  await session.save();
  await session.populate('host', 'name email');
  res.json(session);
};

export const endCall = async (req, res) => {
  const { id } = req.params;
  if (respondIfInvalidObjectId(res, id, 'call id')) return;
  const session = await CallSession.findById(id);
  if (!session) return res.status(404).json({ message: 'Call not found' });

  session.status = 'ended';
  session.endTime = new Date();
  await session.save();
  await session.populate('host', 'name email');
  res.json(session);
};

export const listCallChat = async (req, res) => {
  const { id } = req.params;
  if (respondIfInvalidObjectId(res, id, 'call id')) return;
  const session = await CallSession.findById(id);
  if (!session) return res.status(404).json({ message: 'Call not found' });

  const messages = await CallMessage.find({ call: id })
    .populate('author', 'name email role')
    .sort({ createdAt: 1 });
  res.json(messages);
};

export const postCallChat = async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ message: 'Message body required' });
  if (respondIfInvalidObjectId(res, id, 'call id')) return;

  const session = await CallSession.findById(id);
  if (!session) return res.status(404).json({ message: 'Call not found' });

  const message = await CallMessage.create({
    call: id,
    author: req.user._id,
    body: body.trim()
  });
  await message.populate('author', 'name email role');
  res.status(201).json(message);
};

export const listMyCallLogs = async (req, res) => {
  const userId = req.user._id;
  const logs = await CallLog.find({
    $or: [{ fromUserId: userId }, { toUserId: userId }]
  })
    .populate('fromUserId', 'name email')
    .populate('toUserId', 'name email')
    .sort({ startedAt: -1 })
    .limit(100);
  res.json(logs);
};

export const listTeamCallLogs = async (_req, res) => {
  const logs = await CallLog.find({})
    .populate('fromUserId', 'name email')
    .populate('toUserId', 'name email')
    .sort({ startedAt: -1 })
    .limit(200);
  res.json(logs);
};
