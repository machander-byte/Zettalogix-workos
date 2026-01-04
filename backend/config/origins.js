const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

const normalizeOrigin = (origin) => origin?.replace(/\/$/, '').toLowerCase();

const parseAllowedOrigins = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map(normalizeOrigin);
};

const wildcardToRegex = (pattern) => {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`^${escaped.replace(/\*/g, '.*')}$`);
};

const matchesPattern = (origin, pattern) => {
  if (!pattern) return false;
  if (pattern === origin) return true;
  if (!pattern.includes('*')) return false;
  return wildcardToRegex(pattern).test(origin);
};

const isLocalOrigin = (origin) =>
  origin?.startsWith('http://localhost') || origin?.startsWith('http://127.0.0.1');

export const getAllowedOrigins = () => {
  const envOrigins = parseAllowedOrigins(process.env.CLIENT_URL);
  return Array.from(new Set([...envOrigins, ...DEFAULT_ORIGINS]));
};

export const isOriginAllowed = (origin, allowedOrigins) => {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (isLocalOrigin(normalized)) return true;
  return allowedOrigins.some((pattern) => matchesPattern(normalized, pattern));
};
