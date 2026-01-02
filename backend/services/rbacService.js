import Role from '../models/Role.js';

const roleCache = new Map();

const fetchRole = async (roleName) => {
  if (!roleName) return null;
  if (roleCache.has(roleName)) return roleCache.get(roleName);
  const role = await Role.findOne({ name: roleName });
  if (role) roleCache.set(roleName, role);
  return role;
};

export const ensureUserPermissions = async (user) => {
  if (!user) return null;
  if (!user.permissions || user.permissions.length === 0) {
    const roleDoc = await fetchRole(user.role);
    user.permissions = roleDoc?.permissions || [];
  }
  return user;
};
