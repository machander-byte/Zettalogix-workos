
# WorkHub Professional Work OS

## Introduction
WorkOS is a complete web-based working environment designed to help organizations manage remote work, interns, and employees efficiently. It blends work mode tracking, task management, productivity insights, communication tools, and automated reporting into a single always-on cockpit. The documentation below highlights the product vision, the required admin and employee experiences, and the collaboration capabilities that must ship before 20 Dec so the internship submission earns full credit.

## Product Vision
- Deliver an always-on cockpit that keeps individual operators focused while creating zero-friction collaboration moments for pods and clients.
- Blend asynchronous context (logs, automations, AI nudges) with synchronous rituals (secure calls, arranged stand-ups, file drops) so work can move even when team members shift contexts.
- Provide a professional veneer that feels like an internal operating system: consistent typography, ritual copy, safe defaults, and automation rails that keep data in sync across channels.

## WorkOS - Admin & Employee Features (Internship Project Documentation)
### 2. Admin Requirements & Features
#### 2.1 User & Access Management
- Admin login flows for email/password plus OTP verification keep the control plane secure.
- Role-based access for Super Admin, Admin, and Employee personas gates sensitive settings.
- Add, edit, and deactivate employee accounts without touching the database.
- Assign departments or pods so downstream analytics can group by team.
- Remote password resets and account control tools unblock employees quickly.

#### 2.2 Work Mode & Live Activity Monitoring
- Real-time rosters show who is online and who is currently in Work Mode.
- Activity indicators expose active time, idle time, and optional tab-switch or focus scores.
- Idle alerts and inconsistency warnings give supervisors a proactive signal.

#### 2.3 Projects & Tasks Management
- Create or delete projects and assign prioritized tasks with deadlines and priority flags.
- Track per-task progress with status badges and SLA warnings.
- Support file uploads and threaded task comments for contextual collaboration.
- Provide a task board (To Do, In Progress, Completed) for rapid triage.

#### 2.4 Work Logs & Daily Reports
- View daily logs submitted by employees, including time spent per task.
- Monitor blockers, issues, and next-day plans in a centralized queue.
- Export logs as CSV or PDF for compliance and stakeholders.

#### 2.5 AI-Based Insights
- Generate AI-driven daily or weekly summaries with productivity scoring.
- Surface behavior analysis such as late logins or extended idle patterns.
- Automate weekly and monthly reports that can be routed to leadership.

#### 2.6 Reporting & Analytics
- Provide hours-worked reports and task completion rates per team.
- Visualize team productivity analytics to highlight coaching opportunities.
- Allow admins to download polished PDF reports on demand.

#### 2.7 Communications & Documents
- Announcements panel for high-signal updates plus broadcast messaging.
- Document upload capabilities for SOPs, policies, and shared resources.
- Access control to ensure only the right employees see sensitive files.

#### 2.8 System Settings & Security
- Organization settings for work hours, holidays, and scheduling defaults.
- Admin UI to configure AI provider API keys and quotas.
- Session security with JWT authentication and rotating refresh tokens.
- Full audit logs so admins can trace account changes and system actions.

### 3. Employee Features
#### 3.1 Authentication & Profile
- Login through password or OTP flows tailored to each employee.
- Manage profile details, including role, skills, and work preferences.
- View reporting manager information for routing approvals or feedback.

#### 3.2 Work Mode
- Start or stop Work Mode sessions with reliable timers.
- Track active versus idle time and receive auto-generated session summaries.
- Visualize session analytics to understand focus trends.

#### 3.3 Tasks & Projects
- View assigned tasks, filter them, and adjust status as work progresses.
- Upload files or add comments without leaving the task view.
- Highlight blocked tasks so admins can intervene quickly.

#### 3.4 Daily Work Log
- Submit daily work summaries with time spent per task and problems faced.
- Capture tomorrow's plan so leads see intent for the next shift.

#### 3.5 AI Tools (Optional)
- Trigger AI-generated work summaries or rewrite logs in a professional tone.
- Request weekly report drafts that employees can refine before sending.

#### 3.6 Notifications & Communication
- Receive task notifications, admin announcements, and @mentions.
- Ask questions to admin or HR from the same interface.
- Keep call-side chat history aligned with the meeting cockpit.

#### 3.7 Self Analytics
- Review weekly hours worked, tasks completed, and idle-time graphs.
- Display personal productivity scores to nudge better habits.

#### 3.8 Documents Access
- Browse shared files and download company resources tied to each meeting or task.

## Temporary Database & Access Strategy
- Stand up a Mongo Memory Server (or lightweight SQLite instance) so both admin and employee shells can be exercised without production infrastructure. Seed it with demo orgs, role assignments, tasks, and logs for immediate QA.
- Collections cover `users`, `departments`, `projects`, `tasks`, `workSessions`, `dailyLogs`, and `announcements`. Each entry stores a `role` flag so the UI can hydrate the correct workspace.
- Provide REST endpoints `/api/admin/*` and `/api/employee/*` that share the same transient datastore but enforce access guards through middleware and JWT scopes.
- Include a `seedTempData.ts` script that runs during `npm run dev` to inject Super Admin, Admin, and Employee demo accounts plus corresponding OAuth/OTP secrets.
- Because the database is in-memory, add export/import helpers so interns can dump current data to JSON if they need to pause work or hand over testing artifacts.

## UI Separation: Admin Console vs Employee Workspace
- **Admin Console UI** exposes cards for User Management, Work Mode Monitoring, Tasks/Projects, Logs, AI Insights, Reporting, Communications, Documents, and Organization Settings. Navigation stays on the left with quick actions (Add Employee, New Project, Publish Announcement) pinned to the header.
- **Employee Workspace UI** focuses on Focus Mode, Task Board, Daily Log composer, Notifications, Self Analytics, Documents, and Call/Chat cockpit. The layout mirrors a personal OS with Work Mode controls centered and collaboration widgets stacked on the right.
- Feature flags and route guards render only the components relevant to the authenticated role; for example, `/console/*` routes and high-risk actions (deactivation, audit exports) never load for employee profiles.
- Both shells share foundational components (buttons, panels, charts) but swap color tokens and copy tone so Admin feels like a control room while Employee surfaces coaching nudges.
- The temp database plus scoped APIs allow QA to log in as admin and employee simultaneously in different browser sessions to validate that features remain isolated yet consistent.

## Experience Pillars
1. **Focus Intelligence** - Track live sessions, dwell time per page, idle minutes, and AI-derived focus scores via /work APIs exposed in useWorkStore.
2. **Collaboration Capsule** - House team chat, secure voice calls, and the new meeting cockpit (scheduling, file handoffs, call-side chat) inside a single layout (WorkModePanel).
3. **Operational Memory** - Automations, AI summaries, and logs guarantee that every call produces artifacts (action items, shared files) without needing external tools.

## Call & Chat Enhancements
### Professional Call Hub
- Pro call hub (right column) lets leads start/end secure calls, monitor timers, and see participants plus agendas with one click.
- Live state is synced with UI flourishes ("Standby" vs. "On air" badges) so teams instantly know if they are broadcasting.

### Meeting Cockpit (new)
- **Upcoming meetings list** surfaces anything scheduled or currently live, with contextual tags (channel, attendance, live/queued status).
- **Scheduler form** accepts title, date/time, and attendees; submissions prepend the queue for instant visibility.
- **File handoffs** provide a ledger of assets shared into the room and a micro-form to publish new links without leaving the screen.
- **Call-side chat** keeps prep notes and last-minute reminders beside the voice room. Messages can be posted asynchronously and tagged to the meeting.

### Team Chat Upgrades
- Default chat feed now works alongside the meeting cockpit so async updates, @mentions, and AI nudges remain anchored to the strategy room.
- Sending a message uses lightweight client state, meaning engineers can wire it to Socket.IO or REST whenever real-time transport is ready.

## Architecture Snapshot
| Layer | Stack | Responsibilities |
| --- | --- | --- |
| Frontend | Next.js 14, React 18, Tailwind CSS, Zustand | Renders employee OS layouts, orchestrates WorkMode states (session tracking, call hub, meeting cockpit), interacts with /api/work endpoints via workService. |
| Realtime | Socket.IO client/server | Keeps pods subscribed to live status (calls, AI nudges, task updates). useSocket hook connects authenticated employees to the namespace. |
| Backend API | Express, Helmet, Compression, Mongo/MongoMemoryServer | Provides authentication, work session lifecycle (/api/work), tasks, logs, admin plus AI routes. Configured with strict security headers and cache busting for professional deployments. |
| Persistence | MongoDB or Mongo Memory Server | Stores user profiles, work sessions, tasks, and log histories; memory mode helps local prototyping. |

## Flow: Arrange + Host a Meeting
1. Employee opens **Work Mode** and sees active focus session status, AI guidance, and collaboration controls.
2. From the **Meeting cockpit**, they:
   - Review existing queue (live badges show if someone already broadcasting).
   - Fill the scheduler form with title, time, and attendees so the entry appears instantly in the queue.
   - Share critical files with the handoff form so everyone joins with the latest deck or doc.
   - Drop a prep reminder inside Call-side chat to align before the secure call begins.
3. The lead toggles **Pro call hub** to start the secure call; timer, participants, and agenda remain visible.
4. Automations (Pulse teammates, AI summaries) wait for the call to end to broadcast recaps.

## Implementation Notes
- All meeting, file, and chat state is currently stored client-side for fast prototyping. Hook them to backend endpoints or Socket.IO channels when persistence is required.
- crypto.randomUUID() seeds unique IDs so items can later sync with Mongo _id values.
- Styling uses the shared Tailwind tokens already used across dashboards to preserve the professional OS look.

## Next Opportunities
1. Persist meeting queue plus shared files via new /api/collab endpoints and Socket.IO rooms.
2. Attach recordings or transcripts to finished calls and push AI-generated summaries into the Automations list.
3. Add role-based views so admins can monitor multiple pods' cockpits simultaneously.
4. Integrate governance features (DLP scanning on file links, audit trails for shared assets) to meet enterprise expectations.
