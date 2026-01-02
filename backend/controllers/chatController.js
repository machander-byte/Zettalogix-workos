import ChatThread from '../models/ChatThread.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import { respondIfInvalidObjectId } from '../utils/objectId.js';

const isAdmin = (user) => user.role === 'admin';

const ensureAccess = (thread, user) => {
  if (!thread) return false;
  if (isAdmin(user)) return true;
  return thread.participants.some((participant) => String(participant) === String(user._id));
};

export const listThreads = async (req, res) => {
  const scopeAll = isAdmin(req.user) && req.query.scope === 'all';
  const query = scopeAll ? {} : { participants: req.user._id };
  const threads = await ChatThread.find(query)
    .populate('participants', 'name email role')
    .sort({ lastMessageAt: -1, updatedAt: -1 });
  res.json(threads);
};

export const createDirectThread = async (req, res) => {
  const { participantId } = req.body;
  if (!participantId) return res.status(400).json({ message: 'participantId required' });
  if (respondIfInvalidObjectId(res, participantId, 'participantId')) return;
  const target = await User.findById(participantId);
  if (!target) return res.status(404).json({ message: 'User not found' });

  const participantSet = [req.user._id.toString(), participantId.toString()].sort();
  const existing = await ChatThread.findOne({
    type: 'direct',
    participants: { $all: participantSet, $size: participantSet.length }
  });

  if (existing) {
    await existing.populate('participants', 'name email role');
    return res.json(existing);
  }

  const thread = await ChatThread.create({
    participants: participantSet,
    type: 'direct',
    topic: `${req.user.name.split(' ')[0]} & ${target.name.split(' ')[0]}`
  });
  await thread.populate('participants', 'name email role');
  res.status(201).json(thread);
};

export const getThread = async (req, res) => {
  const { id } = req.params;
  if (respondIfInvalidObjectId(res, id, 'thread id')) return;
  const thread = await ChatThread.findById(id).populate('participants', 'name email role');
  if (!thread) return res.status(404).json({ message: 'Thread not found' });
  if (!ensureAccess(thread, req.user)) return res.status(403).json({ message: 'Forbidden' });
  res.json(thread);
};

export const getThreadMessages = async (req, res) => {
  const { id } = req.params;
  if (respondIfInvalidObjectId(res, id, 'thread id')) return;
  const thread = await ChatThread.findById(id);
  if (!thread) return res.status(404).json({ message: 'Thread not found' });
  if (!ensureAccess(thread, req.user)) return res.status(403).json({ message: 'Forbidden' });

  const messages = await ChatMessage.find({ thread: id })
    .populate('author', 'name email role')
    .sort({ createdAt: 1 });
  res.json(messages);
};

export const postThreadMessage = async (req, res) => {
  const { id } = req.params;
  const { body } = req.body;
  if (!body?.trim()) return res.status(400).json({ message: 'Message body required' });
  if (respondIfInvalidObjectId(res, id, 'thread id')) return;

  const thread = await ChatThread.findById(id);
  if (!thread) return res.status(404).json({ message: 'Thread not found' });
  if (!ensureAccess(thread, req.user)) return res.status(403).json({ message: 'Forbidden' });

  const message = await ChatMessage.create({
    thread: id,
    author: req.user._id,
    body: body.trim()
  });
  thread.lastMessageAt = new Date();
  await thread.save();
  await message.populate('author', 'name email role');
  res.status(201).json(message);
};
