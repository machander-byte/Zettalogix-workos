import Task from '../models/Task.js';
import {
  respondIfInvalidObjectId,
  isValidObjectId
} from '../utils/objectId.js';
import { recordAuditLog } from '../utils/auditLogger.js';

const populateTask = (docOrQuery) =>
  docOrQuery.populate([
    { path: 'assignedTo', select: 'name email role' },
    { path: 'assignedBy', select: 'name email role' },
    { path: 'comments.user', select: 'name email role' },
    { path: 'project', select: 'name code status priority' }
  ]);

const captureHistory = (task, field, fromValue, toValue, actor, action = 'updated') => {
  if (fromValue === toValue) return;
  task.history.push({ action, field, from: fromValue, to: toValue, actor });
};

const buildFileUrl = (req, file) =>
  `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

export const createTask = async (req, res) => {
  if (!req.body?.assignedTo)
    return res.status(400).json({ message: 'assignedTo required' });
  if (respondIfInvalidObjectId(res, req.body.assignedTo, 'assignedTo')) return;
  if (req.body.project && !isValidObjectId(req.body.project))
    return res.status(400).json({ message: 'Invalid project id' });

  const task = await Task.create({
    ...req.body,
    assignedBy: req.user._id
  });
  captureHistory(task, 'status', null, task.status, req.user._id, 'created');
  await task.save();
  const populated = await populateTask(Task.findById(task._id));
  const entity = await populated;
  await recordAuditLog({
    user: req.user._id,
    role: req.user.role,
    action: 'task:create',
    entityType: 'task',
    entityId: task._id,
    description: `Task ${task.title} created`,
    metadata: { priority: task.priority },
    ipAddress: req.ip
  });
  res.status(201).json(entity);
};

export const getTasksForUser = async (req, res) => {
  const { id } = req.params;
  if (respondIfInvalidObjectId(res, id, 'user id')) return;
  const isSelf = String(req.user._id) === String(id);
  if (!isSelf && !['admin', 'manager'].includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden' });

  const query = Task.find({ assignedTo: id }).sort({ createdAt: -1 });
  const tasks = await populateTask(query);
  res.json(tasks);
};

export const getTaskById = async (req, res) => {
  const { id } = req.params;
  if (respondIfInvalidObjectId(res, id, 'task id')) return;
  const task = await populateTask(Task.findById(id));
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isOwner = String(task.assignedTo?._id || task.assignedTo) === String(req.user._id);
  if (!isOwner && !['admin', 'manager'].includes(req.user.role))
    return res.status(403).json({ message: 'Forbidden' });

  res.json(task);
};

export const updateTask = async (req, res) => {
  const { id } = req.params;
  if (respondIfInvalidObjectId(res, id, 'task id')) return;
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isOwner = String(task.assignedTo) === String(req.user._id);
  const privileged = ['admin', 'manager'].includes(req.user.role);
  if (!isOwner && !privileged) return res.status(403).json({ message: 'Forbidden' });

  if (req.body?.assignedTo && !isValidObjectId(req.body.assignedTo))
    return res.status(400).json({ message: 'Invalid assignedTo' });
  if (req.body?.project && !isValidObjectId(req.body.project))
    return res.status(400).json({ message: 'Invalid project id' });

  const prev = task.toObject();
  Object.assign(task, req.body);
  captureHistory(task, 'status', prev.status, task.status, req.user._id);
  captureHistory(task, 'priority', prev.priority, task.priority, req.user._id);
  captureHistory(task, 'dueDate', prev.dueDate, task.dueDate, req.user._id);
  captureHistory(task, 'assignedTo', prev.assignedTo, task.assignedTo, req.user._id);
  captureHistory(task, 'project', prev.project, task.project, req.user._id);
  await task.save();
  const populated = await populateTask(Task.findById(task._id));
  await recordAuditLog({
    user: req.user._id,
    role: req.user.role,
    action: 'task:update',
    entityType: 'task',
    entityId: task._id,
    description: `Task ${task.title} updated`,
    metadata: req.body,
    ipAddress: req.ip
  });
  res.json(await populated);
};

export const addTaskComment = async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message || !message.trim())
    return res.status(400).json({ message: 'Message required' });
  if (respondIfInvalidObjectId(res, id, 'task id')) return;

  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isOwner = String(task.assignedTo) === String(req.user._id);
  const privileged = ['admin', 'manager'].includes(req.user.role);
  if (!isOwner && !privileged) return res.status(403).json({ message: 'Forbidden' });

  task.comments.push({ user: req.user._id, message: message.trim() });
  await task.save();
  const populated = await populateTask(Task.findById(task._id));
  await recordAuditLog({
    user: req.user._id,
    role: req.user.role,
    action: 'task:comment',
    entityType: 'task',
    entityId: task._id,
    description: `New comment on ${task.title}`,
    metadata: { message },
    ipAddress: req.ip
  });
  res.json(await populated);
};

export const addTaskAttachment = async (req, res) => {
  const { id } = req.params;
  if (respondIfInvalidObjectId(res, id, 'task id')) return;
  const task = await Task.findById(id);
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const isOwner = String(task.assignedTo) === String(req.user._id);
  const privileged = ['admin', 'manager'].includes(req.user.role);
  if (!isOwner && !privileged) return res.status(403).json({ message: 'Forbidden' });

  const files = req.files?.length ? req.files : req.file ? [req.file] : [];
  if (!files.length) return res.status(400).json({ message: 'No files uploaded' });

  files.forEach((file) => {
    task.attachments.push({
      name: file.originalname,
      url: buildFileUrl(req, file),
      uploadedBy: req.user._id
    });
  });

  await task.save();
  const populated = await populateTask(Task.findById(task._id));
  await recordAuditLog({
    user: req.user._id,
    role: req.user.role,
    action: 'task:attachment',
    entityType: 'task',
    entityId: task._id,
    description: `Attachment uploaded to ${task.title}`,
    metadata: { files: files.map((file) => file.originalname) },
    ipAddress: req.ip
  });
  res.json(await populated);
};
