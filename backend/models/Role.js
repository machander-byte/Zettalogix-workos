import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    label: { type: String, required: true },
    description: String,
    permissions: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

roleSchema.statics.ensureCoreRoles = async function ensureCoreRoles() {
  const defaults = [
    {
      name: 'admin',
      label: 'Administrator',
      permissions: [
        'users:manage',
        'tasks:manage',
        'attendance:override',
        'reports:view',
        'projects:manage',
        'notifications:manage',
        'audit:view'
      ]
    },
    {
      name: 'manager',
      label: 'Manager',
      permissions: [
        'tasks:manage',
        'attendance:view',
        'projects:manage',
        'reports:view'
      ]
    },
    {
      name: 'employee',
      label: 'Employee',
      permissions: ['tasks:update', 'attendance:submit', 'workmode:use']
    },
    {
      name: 'hr',
      label: 'Human Resources',
      permissions: ['users:manage', 'attendance:override', 'reports:view']
    },
    {
      name: 'auditor',
      label: 'Auditor',
      permissions: ['reports:view', 'audit:view']
    }
  ];

  await Promise.all(
    defaults.map((role) =>
      this.updateOne({ name: role.name }, { $setOnInsert: role }, { upsert: true })
    )
  );
};

const Role = mongoose.model('Role', roleSchema);
export default Role;
