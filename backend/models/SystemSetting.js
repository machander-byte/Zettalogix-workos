import mongoose from 'mongoose';

const systemSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: mongoose.Schema.Types.Mixed
  },
  { timestamps: true }
);

const SystemSetting = mongoose.model('SystemSetting', systemSettingSchema);
export default SystemSetting;
