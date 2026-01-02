import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    action: String,
    field: String,
    from: mongoose.Schema.Types.Mixed,
    to: mongoose.Schema.Types.Mixed,
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'done'],
      default: 'todo'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    dueDate: Date,
    estimatedHours: Number,
    attachments: [attachmentSchema],
    comments: [commentSchema],
    history: [historySchema],
    tags: [String]
  },
  { timestamps: true }
);

const Task = mongoose.model('Task', taskSchema);
export default Task;
