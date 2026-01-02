import CollabMessage from '../models/CollabMessage.js';
import CollabFile from '../models/CollabFile.js';

const resolveRoom = (value) => (value && String(value).trim() ? String(value).trim() : 'strategy');

export const listRoomMessages = async (req, res) => {
  const room = resolveRoom(req.query.room);
  const messages = await CollabMessage.find({ room })
    .populate('author', 'name email role')
    .sort({ createdAt: 1 });
  res.json(messages);
};

export const postRoomMessage = async (req, res) => {
  const room = resolveRoom(req.body?.room);
  const body = req.body?.body?.trim();
  if (!body) return res.status(400).json({ message: 'Message body required' });

  const message = await CollabMessage.create({
    room,
    body,
    author: req.user._id
  });
  await message.populate('author', 'name email role');
  res.status(201).json(message);
};

export const listRoomFiles = async (req, res) => {
  const room = resolveRoom(req.query.room);
  const files = await CollabFile.find({ room })
    .populate('owner', 'name email role')
    .sort({ createdAt: -1 });
  res.json(files);
};

export const postRoomFile = async (req, res) => {
  const room = resolveRoom(req.body?.room);
  const name = req.body?.name?.trim();
  if (!name) return res.status(400).json({ message: 'File name required' });
  const link = req.body?.link?.trim() || 'Internal drop';

  const file = await CollabFile.create({
    room,
    name,
    link,
    owner: req.user._id
  });
  await file.populate('owner', 'name email role');
  res.status(201).json(file);
};
