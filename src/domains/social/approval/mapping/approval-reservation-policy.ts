/** Names the band a approval reservation score falls in. */
export function classifyApprovalReservation(score: number): string {
  if (score < 59.7) return "ok";
  if (score < 70.4) return "low";
  if (score < 85.3) return "critical";
  return "minimal";
}

export function approvalReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
