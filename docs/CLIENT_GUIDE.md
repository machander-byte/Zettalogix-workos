# WorkHub Client Guide

## Product summary
WorkHub is a role-based work OS that brings attendance, tasks, communication, and work insights into one workspace.

## Roles and access
- Admin: full control of users, settings, and analytics.
- Manager/HR: operational oversight and people management based on role permissions.
- Employee: day-to-day productivity tools and collaboration.

## Employee experience
- Dashboard: status, active and idle time, notifications, and quick tabs (Work, Tasks, Company Mail, Internal Browser).
- Work Mode: start and stop focus sessions, log active pages, record idle minutes, and review the call queue.
- Calls: audio or video sessions plus call notes.
- Chat: direct messages, new threads, and quick audio/video calls.
- Tasks: view assigned work, update status, and comment.
- Logs: submit daily work logs.
- Work Browser: in-app browser for internal tools.
- AI Summary: generate a daily summary from tasks and logs (requires OpenAI key).

## Admin experience
- Dashboard: live metrics, focus and attendance trends, alerts, and audit feed.
- Status: real-time active, idle, and offline presence.
- Employees: create and update users, roles, and status.
- Tasks: assign work and track progress.
- Conversations: review chat threads and call activity.
- Calls: schedule and monitor call sessions.
- Logs: review activity logs and audits.
- Reports: export summaries and trends.
- Controls: system settings and policies.

## Typical workflows
- Onboarding: Admin creates user -> user logs in -> status tracking starts.
- Daily flow: Employee opens Dashboard -> starts Work Mode -> manages tasks -> submits logs.
- Collaboration: Chat and calls keep conversations in-app.
- Oversight: Admin reviews dashboard, status, and reports.

## Demo script (5-7 minutes)
1. Admin view: Dashboard -> Status -> Tasks -> Conversations -> Reports.
2. Employee view: Dashboard -> Work Mode -> Tasks -> Chat -> Work Browser -> AI Summary.
3. Close with privacy note: tracking is scoped to Work OS surfaces and respects in-app content boundaries.

## Notes for clients
- In-app browser uses an iframe; some sites block embedding via security headers.
- Calls use WebRTC; TURN is optional for restricted networks.
