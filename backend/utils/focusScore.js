export const calculateFocusScore = (session) => {
  const start = session.startTime ? new Date(session.startTime).getTime() : 0;
  const end = session.endTime ? new Date(session.endTime).getTime() : Date.now();
  const total = Math.max(end - start, 1);
  const idle = Math.min(session.idleTime || 0, total);
  const productiveRatio = (total - idle) / total;
  const switchPenalty = Math.max(0.4, 1 - (session.tabSwitchCount || 0) / 30);
  const baseScore = productiveRatio * 80 + switchPenalty * 20;
  return Math.round(Math.min(100, Math.max(0, baseScore)));
};
