/** Active writing time, capped at one minute after the last editor interaction. */
export function editingDelta(previous: number, now: number, lastActivity: number, active: boolean): number {
  if (!active || now <= previous) return 0;
  return Math.max(0, Math.min(now, lastActivity + 60000) - previous) / 1000;
}
export function formatEditingTime(seconds: number): string {
  const total = Math.floor(Math.max(0, seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}