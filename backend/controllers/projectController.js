import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { respondIfInvalidObjectId } from '../utils/objectId.js';
import { recordAuditLog } from '../utils/auditLogger.js';

const canManageProjects = (user) => ['admin', 'manager'].includes(user.role);

export const listProjects = async (req, res) => {
  const filter = {};
  if (req.user.role === 'employee') {
    filter.$or = [{ members: req.user._id }, { owner: req.user._id }];
  } else if (req.user.role === 'manager') {
    filter.$or = [{ owner: req.user._id }, { managers: req.user._id }];
  }

  const projects = await Project.find(filter)
    .populate('owner', 'name email')
    .populate('managers', 'name email')
    .populate('members', 'name email role')
    .sort({ updatedAt: -1 });
  res.json(projects);
};

export const createProject = async (req, res) => {
  if (!canManageProjects(req.user))
    return res.status(403).json({ message: 'Forbidden' });
  const payload = req.body || {};
  const project = await Project.create({
    ...payload,
    owner: payload.owner || req.user._id,
    managers: payload.managers || [req.user._id]
  });
  await recordAuditLog({
    user: req.user._id,
    role: req.user.role,
    action: 'project:create',
    entityType: 'project',
    entityId: project._id,
    description: `Project ${project.name} created`,
    metadata: { priority: project.priority },
    ipAddress: req.ip
  });
  const populated = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('managers', 'name email')
    .populate('members', 'name email role');
  res.status(201).json(populated);
};

export const updateProject = async (req, res) => {
  if (respondIfInvalidObjectId(res, req.params.id, 'project id')) return;
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (!canManageProjects(req.user) && String(project.owner) !== String(req.user._id))
    return res.status(403).json({ message: 'Forbidden' });

  Object.assign(project, req.body);
  await project.save();
  await recordAuditLog({
    user: req.user._id,
    role: req.user.role,
    action: 'project:update',
    entityType: 'project',
    entityId: project._id,
    description: `Project ${project.name} updated`,
    metadata: req.body,
    ipAddress: req.ip
  });

  const populated = await Project.findById(project._id)
    .populate('owner', 'name email')
    .populate('managers', 'name email')
    .populate('members', 'name email role');
  res.json(populated);
};

export const getProject = async (req, res) => {
  if (respondIfInvalidObjectId(res, req.params.id, 'project id')) return;
  const project = await Project.findById(req.params.id)
    .populate('owner', 'name email')
    .populate('managers', 'name email')
    .populate('members', 'name email role');
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
};

export const getProjectTasks = async (req, res) => {
  if (respondIfInvalidObjectId(res, req.params.id, 'project id')) return;
  const tasks = await Task.find({ project: req.params.id })
    .populate('assignedTo', 'name email role')
    .populate('assignedBy', 'name email role');
  res.json(tasks);
};
