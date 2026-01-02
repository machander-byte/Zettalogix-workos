import Document from '../models/Document.js';

const parseList = (value) =>
  value
    ? String(value)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const buildFileUrl = (req, file) =>
  `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

export const listDocuments = async (req, res) => {
  const role = req.user?.role;
  const query =
    role && role !== 'admin'
      ? {
          $or: [
            { accessRoles: { $exists: false } },
            { accessRoles: { $size: 0 } },
            { accessRoles: role }
          ]
        }
      : {};
  const docs = await Document.find(query)
    .populate('uploadedBy', 'name email role')
    .sort({ createdAt: -1 });
  res.json(docs);
};

export const uploadDocument = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'File required' });
  const accessRoles = parseList(req.body?.accessRoles);
  const tags = parseList(req.body?.tags);

  const doc = await Document.create({
    name: req.body?.name?.trim() || req.file.originalname,
    description: req.body?.description?.trim() || undefined,
    url: buildFileUrl(req, req.file),
    mimeType: req.file.mimetype,
    size: req.file.size,
    tags,
    accessRoles,
    uploadedBy: req.user?._id
  });
  await doc.populate('uploadedBy', 'name email role');
  res.status(201).json(doc);
};
