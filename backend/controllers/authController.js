import bcrypt from 'bcryptjs';
import { createHmac } from 'crypto';
import User from '../models/User.js';
import Role from '../models/Role.js';
import {
  issueSessionTokens,
  verifyRefreshToken,
  rotateRefreshToken,
  createAccessToken,
  revokeRefreshToken
} from '../utils/tokenService.js';
import { recordAuditLog } from '../utils/auditLogger.js';
import { startSession } from '../services/workSessionService.js';

const buildContext = (req) => ({
  ip: req.ip,
  userAgent: req.get('user-agent')
});

const OTP_TTL_MS = Number(process.env.OTP_TTL_MINUTES || 5) * 60 * 1000;
const OTP_LENGTH = Number(process.env.OTP_LENGTH || 6);
const OTP_SECRET = process.env.OTP_SECRET || process.env.JWT_SECRET || 'workhub-otp';
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_RESEND_COOLDOWN_MS = Number(process.env.OTP_RESEND_COOLDOWN_SEC || 30) * 1000;
const SHOULD_EXPOSE_OTP =
  process.env.SHOW_OTP_IN_RESPONSE === 'true' || process.env.NODE_ENV !== 'production';
const ALLOW_BOOTSTRAP_ADMIN = process.env.ALLOW_BOOTSTRAP_ADMIN === 'true';

const parseRoleList = (value) => {
  if (value === undefined) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized || ['none', 'false', 'off', '0'].includes(normalized)) return [];
  return normalized
    .split(',')
    .map((role) => role.trim().toLowerCase())
    .filter(Boolean);
};

const DEFAULT_OTP_ROLES = ['admin', 'employee'];
const OTP_REQUIRED_ROLES = parseRoleList(process.env.OTP_REQUIRED_ROLES) ?? DEFAULT_OTP_ROLES;

const respondWithSession = (res, user, tokens, status = 200) =>
  res.status(status).json({
    token: tokens.token,
    refreshToken: tokens.refreshToken,
    user: user.toSafeObject()
  });

const hashOtp = (otp) =>
  createHmac('sha256', OTP_SECRET).update(otp).digest('hex');

const generateOtp = () => {
  const length = Number.isFinite(OTP_LENGTH) && OTP_LENGTH > 3 ? OTP_LENGTH : 6;
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return String(Math.floor(Math.random() * (max - min) + min));
};

const clearOtp = (user) => {
  user.otpCodeHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
};

const issueOtp = async (user) => {
  const otp = generateOtp();
  user.otpCodeHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.otpLastSentAt = new Date();
  user.otpAttempts = 0;
  await user.save();
  if (SHOULD_EXPOSE_OTP) return otp;
  console.log(`[OTP] ${user.email}: ${otp} (expires ${user.otpExpiresAt.toISOString()})`);
  return undefined;
};

const normalizeRole = (role) => (role || '').toString().trim().toLowerCase();
const requiresOtp = (user) => OTP_REQUIRED_ROLES.includes(normalizeRole(user.role));

const respondWithOtpChallenge = (res, user, otp) =>
  res.json({
    otpRequired: true,
    delivery: 'email',
    email: user.email,
    expiresAt: user.otpExpiresAt?.toISOString(),
    ...(otp ? { otp } : {})
  });

const attachRoleMetadata = async (user) => {
  if (user.roleRef) return user;
  const roleDoc = await Role.findOne({ name: user.role });
  if (roleDoc) {
    user.roleRef = roleDoc._id;
    user.permissions = roleDoc.permissions;
    await user.save();
  }
  return user;
};

const completeLogin = async (req, res, user, auditMetadata = {}) => {
  user.lastLogin = new Date();
  user.status = 'active';
  user.lastActiveAt = new Date();
  clearOtp(user);
  await attachRoleMetadata(user);
  await user.save();
  await startSession(user._id, user._id);

  const tokens = await issueSessionTokens(user, buildContext(req));
  await recordAuditLog({
    user: user._id,
    role: user.role,
    action: 'auth:login',
    entityType: 'user',
    entityId: user._id,
    description: `${user.name} logged in`,
    metadata: auditMetadata,
    ipAddress: req.ip
  });

  respondWithSession(res, user, tokens);
};

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Missing fields' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already registered' });

  const requestedRole = normalizeRole(role);
  const isBootstrap = ALLOW_BOOTSTRAP_ADMIN && (await User.estimatedDocumentCount()) === 0;
  const allowedRoles = isBootstrap ? ['admin', 'manager', 'hr', 'employee'] : ['employee'];
  const finalRole = allowedRoles.includes(requestedRole) ? requestedRole : 'employee';
  const roleDoc = await Role.findOne({ name: finalRole });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashed,
    role: finalRole,
    roleRef: roleDoc?._id,
    permissions: roleDoc?.permissions || undefined
  });

  const tokens = await issueSessionTokens(user, buildContext(req));
  await recordAuditLog({
    user: user._id,
    role: user.role,
    action: 'auth:register',
    entityType: 'user',
    entityId: user._id,
    description: `${user.name} created an account`,
    metadata: { role: finalRole },
    ipAddress: req.ip
  });
  respondWithSession(res, user, tokens, 201);
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  if (user.isDeactivated) return res.status(403).json({ message: 'Account disabled' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: 'Invalid credentials' });

  await attachRoleMetadata(user);
  if (requiresOtp(user)) {
    if (
      user.otpLastSentAt &&
      Date.now() - new Date(user.otpLastSentAt).getTime() < OTP_RESEND_COOLDOWN_MS
    ) {
      return res.status(429).json({ message: 'OTP recently sent. Please wait a moment.' });
    }
    const otp = await issueOtp(user);
    return respondWithOtpChallenge(res, user, otp);
  }

  return completeLogin(req, res, user, { email });
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: 'Email and OTP required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  if (user.isDeactivated) return res.status(403).json({ message: 'Account disabled' });

  if (!user.otpCodeHash || !user.otpExpiresAt) {
    return res.status(400).json({ message: 'OTP expired or not requested' });
  }
  if (user.otpExpiresAt.getTime() < Date.now()) {
    clearOtp(user);
    await user.save();
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    clearOtp(user);
    await user.save();
    return res.status(429).json({ message: 'OTP attempts exceeded. Login again.' });
  }

  const match = hashOtp(String(otp)) === user.otpCodeHash;
  if (!match) {
    user.otpAttempts += 1;
    await user.save();
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  return completeLogin(req, res, user, { email, method: 'otp' });
};

export const resendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });
  const user = await User.findOne({ email });
  if (!user || user.isDeactivated) {
    return res.json({ otpRequired: true, delivery: 'email' });
  }
  if (!requiresOtp(user)) {
    return res.status(400).json({ message: 'OTP not required for this account' });
  }
  if (
    user.otpLastSentAt &&
    Date.now() - new Date(user.otpLastSentAt).getTime() < OTP_RESEND_COOLDOWN_MS
  ) {
    return res.status(429).json({ message: 'OTP recently sent. Please wait a moment.' });
  }
  const otp = await issueOtp(user);
  return respondWithOtpChallenge(res, user, otp);
};

export const refreshSession = async (req, res) => {
  const tokenValue = req.body.refreshToken || req.cookies?.refreshToken;
  const session = await verifyRefreshToken(tokenValue);
  if (!session) return res.status(401).json({ message: 'Invalid refresh token' });

  const user = await User.findById(session.user);
  if (!user) {
    await revokeRefreshToken(tokenValue);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
  await attachRoleMetadata(user);

  const refreshToken = await rotateRefreshToken(session, buildContext(req));
  const token = createAccessToken(user);
  respondWithSession(res, user, { token, refreshToken });
};

export const logout = async (req, res) => {
  const tokenValue = req.body.refreshToken || req.cookies?.refreshToken;
  if (tokenValue) await revokeRefreshToken(tokenValue);
  res.json({ success: true });
};

export const profile = async (req, res) => {
  const user = await attachRoleMetadata(req.user);
  res.json({ user: user.toSafeObject() });
};
