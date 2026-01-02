import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, unique: true, sparse: true },
    description: String,
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'archived'],
      default: 'active'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startDate: Date,
    dueDate: Date,
    tags: [String],
    lastActivityAt: Date
  },
  { timestamps: true }
);

projectSchema.pre('save', function updateActivity(next) {
  this.lastActivityAt = new Date();
  next();
});

const Project = mongoose.model('Project', projectSchema);
export default Project;
