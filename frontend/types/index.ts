export type Role = 'admin' | 'manager' | 'employee' | 'hr' | 'auditor';

export type ActivityStatus = 'active' | 'idle' | 'offline';

export interface IEmployeeStatusRecord {
  _id: string;
  name: string;
  email: string;
  role: Role;
  status: ActivityStatus;
  idleMinutes: number;
  workingMinutes: number;
  sessionStatus: 'active' | 'paused' | 'stopped';
  sessionStart?: string;
  reason?: string;
}

export interface IEmployeeStatusSnapshot {
  updatedAt: string;
  summary: {
    active: number;
    idle: number;
    offline: number;
  };
  users: IEmployeeStatusRecord[];
}

export interface ISystemSettings {
  idleAlertSoftMinutes: number;
  idleAlertAdminMinutes: number;
  workStartHour: number;
  workEndHour: number;
  alertsEnabled: boolean;
  alertRoles: Role[];
  activeOutsideWorkHours: boolean;
}

export interface IBrowserSettings {
  browserEnabled: boolean;
  browserHomeUrl?: string;
  browserAllowedUrls?: string[];
}

export interface IActivityAlert {
  _id: string;
  user: { _id: string; name: string; email: string; role: Role };
  type: 'idle_soft' | 'idle_admin' | 'offline_work_hours' | 'active_outside';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface IReportUserRow {
  user: {
    _id: string;
    name: string;
    email: string;
    department?: string;
    role: Role;
  };
  activeMinutes: number;
  idleMinutes: number;
  offlineMinutes: number;
  sessions: number;
}

export interface IDailyActivityReport {
  date: string;
  workMinutes: number;
  users: IReportUserRow[];
}

export interface IWeeklySummaryReport {
  period: string;
  workMinutes: number;
  users: IReportUserRow[];
}

export interface ITeamOverviewReport {
  workMinutes: number;
  summary: {
    department: string;
    activeMinutes: number;
    idleMinutes: number;
    offlineMinutes: number;
    count: number;
  }[];
}

export interface IIdlePatternEntry {
  user: {
    _id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
  count: number;
  latest: string;
}

export interface IIdlePatternReport {
  windowDays: number;
  patterns: IIdlePatternEntry[];
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  title?: string;
  status?: 'active' | 'inactive';
  lastActiveAt?: string;
  employmentType?: 'full_time' | 'part_time' | 'contract';
  workHoursPerWeek?: number;
  attendancePreferences?: {
    shiftStart?: string;
    shiftEnd?: string;
    timezone?: string;
  };
  manager?: Pick<IUser, '_id' | 'name' | 'email'> | string;
}

export interface IWorkSession {
  _id: string;
  user: string;
  startTime: string;
  startAt?: string;
  endTime?: string;
  endAt?: string;
  idleTime: number;
  activeMs?: number;
  idleMs?: number;
  lastTickAt?: string;
  focusScore: number;
  activePages: { url: string; title?: string; duration?: number }[];
  tabSwitchCount: number;
  status: 'active' | 'paused' | 'stopped';
  events?: {
    type: string;
    actor?: IUser | string;
    metadata?: Record<string, unknown>;
    timestamp?: string;
  }[];
}

export interface IWorkdayTotals {
  activeMs: number;
  idleMs: number;
}

export interface IProject {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner?: IUser | string;
  managers?: (IUser | string)[];
  members?: (IUser | string)[];
  startDate?: string;
  dueDate?: string;
  tags?: string[];
}

export interface ITaskHistoryEntry {
  action: string;
  field?: string;
  from?: unknown;
  to?: unknown;
  actor?: IUser | string;
  createdAt?: string;
}

export interface ITaskAttachment {
  name?: string;
  url?: string;
  uploadedBy?: IUser | string;
  uploadedAt?: string;
}

export interface ITask {
  _id: string;
  title: string;
  description?: string;
  assignedTo?: IUser | string;
  assignedBy?: IUser | string;
  project?: IProject | string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  estimatedHours?: number;
  comments?: ITaskComment[];
  attachments?: ITaskAttachment[];
  history?: ITaskHistoryEntry[];
  tags?: string[];
}

export interface IDailyLog {
  _id: string;
  user?: IUser;
  whatDone: string;
  problems?: string;
  tomorrowPlan?: string;
  timeSpentPerTask?: { taskTitle?: string; minutes?: number }[];
  createdAt: string;
}

export interface ITaskComment {
  user?: IUser | string;
  message: string;
  createdAt?: string;
}

export interface IAttendanceRecord {
  _id: string;
  user?: IUser;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
  workedMinutes?: number;
  totalBreakMinutes?: number;
  breaks?: { start: string; end?: string }[];
  summary?: string;
}

export interface IAdminDashboardSnapshot {
  metrics: {
    totalEmployees: number;
    activeEmployees: number;
    totalProjects: number;
    onlineEmployees: number;
    hoursToday: number;
    hoursWeek: number;
    hoursMonth: number;
  };
  taskSummary: Record<string, number>;
  attendanceToday: IAttendanceRecord[];
  focusTrend: { label: string; focusScore: number }[];
  alerts: { type: string; message: string }[];
  idleUsers: IUser[];
  recentActivity: IActivityLog[];
}

export interface IActivityLog {
  _id: string;
  user?: IUser;
  role?: string;
  action: string;
  entityType: string;
  entityId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface IPresenceMetrics {
  onlineUsers: number;
  idleUsers: number;
  activeSessions: number;
  liveHours: number;
}

export interface IPresenceUser {
  _id: string;
  name: string;
  role: Role;
  idle: boolean;
  lastActiveAt?: string;
  sessionStatus?: 'idle' | 'active' | 'paused' | 'stopped';
  sessionStart?: string;
}

export interface IPresencePayload {
  timestamp: string;
  liveMetrics: IPresenceMetrics;
  activeUsers: IPresenceUser[];
  idleUsers: IPresenceUser[];
}

export interface IPresenceUserStatus {
  _id: string;
  name: string;
  role: Role;
  status: ActivityStatus;
  lastActiveAt?: string;
}

export interface INotification {
  _id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: string;
  readAt?: string;
  context?: Record<string, unknown>;
}

export interface IDocument {
  _id: string;
  name: string;
  url: string;
  description?: string;
  tags?: string[];
  mimeType?: string;
  size?: number;
  accessRoles?: Role[];
  uploadedBy?: IUser;
  createdAt: string;
  updatedAt: string;
}

export interface IAnnouncement {
  _id: string;
  title: string;
  body: string;
  targetRoles?: Role[];
  createdBy?: IUser;
  createdAt: string;
  updatedAt: string;
}

export interface ICallSession {
  _id: string;
  title: string;
  scheduledFor?: string;
  channel: string;
  attendees: string[];
  status: 'scheduled' | 'live' | 'ended';
  host?: IUser;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICallMessage {
  _id: string;
  call: string | ICallSession;
  author?: IUser;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICollabMessage {
  _id: string;
  room: string;
  author?: IUser;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICollabFile {
  _id: string;
  room: string;
  name: string;
  link: string;
  owner?: IUser;
  createdAt: string;
  updatedAt: string;
}

export type CallLogStatus = 'missed' | 'answered' | 'rejected' | 'cancelled';

export interface ICallLog {
  _id: string;
  callId: string;
  fromUserId: IUser;
  toUserId: IUser;
  type: 'audio' | 'video';
  status: CallLogStatus;
  startedAt: string;
  endedAt: string;
  durationSec: number;
}

export interface IChatThread {
  _id: string;
  participants: IUser[];
  type: 'direct' | 'room';
  topic?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IChatMessage {
  _id: string;
  thread: string | IChatThread;
  author?: IUser;
  body: string;
  createdAt: string;
  updatedAt: string;
}
