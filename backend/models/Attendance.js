import mongoose from 'mongoose';

const breakSchema = new mongoose.Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date }
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    workedMinutes: { type: Number, default: 0 },
    totalBreakMinutes: { type: Number, default: 0 },
    breaks: [breakSchema],
    notes: String,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'missed'],
      default: 'pending'
    },
    summary: String,
    manualOverride: {
      active: { type: Boolean, default: false },
      reason: String,
      appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      appliedAt: Date
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

attendanceSchema.methods.calculateWorkedMinutes = function calculateWorkedMinutes() {
  if (!this.checkIn || !this.checkOut) return;
  const totalMs = this.checkOut.getTime() - this.checkIn.getTime();
  const breakMs = this.breaks.reduce((sum, entry) => {
    if (!entry.end) return sum;
    return sum + Math.max(0, entry.end.getTime() - entry.start.getTime());
  }, 0);
  this.workedMinutes = Math.max(0, Math.round((totalMs - breakMs) / 60000));
  this.totalBreakMinutes = Math.max(0, Math.round(breakMs / 60000));
};

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
