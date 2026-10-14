export function primaryFraudCheckAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a primary fraud check assignment score falls in. */
export function classifyPrimaryFraudCheckAssignment(score: number): string {
  if (score < 58.3) return "elevated";
  if (score < 96.5) return "high";
  return "ok";
}
