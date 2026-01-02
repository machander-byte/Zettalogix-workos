import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dayjs from 'dayjs';
import RefreshToken from '../models/RefreshToken.js';

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '30m';
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 14);

const hashToken = (value) => crypto.createHash('sha256').update(value).digest('hex');

export const createAccessToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );

const persistRefreshToken = async ({ userId, token, context = {} }) => {
  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt: dayjs().add(REFRESH_TOKEN_DAYS, 'day').toDate(),
    userAgent: context.userAgent,
    ipAddress: context.ip
  });
};

export const issueSessionTokens = async (user, context = {}) => {
  const token = createAccessToken(user);
  const refreshToken = crypto.randomBytes(40).toString('hex');
  await persistRefreshToken({ userId: user._id, token: refreshToken, context });
  return { token, refreshToken };
};

export const verifyRefreshToken = async (tokenValue) => {
  if (!tokenValue) return null;
  const tokenHash = hashToken(tokenValue);
  const session = await RefreshToken.findOne({ tokenHash });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: session._id });
    return null;
  }
  return session;
};

export const rotateRefreshToken = async (session, context = {}) => {
  const nextToken = crypto.randomBytes(40).toString('hex');
  session.tokenHash = hashToken(nextToken);
  session.expiresAt = dayjs().add(REFRESH_TOKEN_DAYS, 'day').toDate();
  session.userAgent = context.userAgent;
  session.ipAddress = context.ip;
  await session.save();
  return nextToken;
};

export const revokeRefreshToken = async (tokenValue) => {
  if (!tokenValue) return;
  await RefreshToken.deleteOne({ tokenHash: hashToken(tokenValue) });
};

export const revokeAllUserTokens = async (userId) => {
  await RefreshToken.deleteMany({ user: userId });
};
