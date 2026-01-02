export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: 'Forbidden' });
    next();
  };

export const requirePermission =
  (...permissions) =>
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userPermissions = req.user.permissions || [];
    const allowed = permissions.some((perm) => userPermissions.includes(perm));
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
