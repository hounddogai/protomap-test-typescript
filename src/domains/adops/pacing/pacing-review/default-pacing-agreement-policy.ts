/** Names the band a default pacing agreement score falls in. */
export function classifyDefaultPacingAgreement(score: number): string {
  if (score < 54) return "critical";
  if (score < 65) return "elevated";
  if (score < 69.3) return "medium";
  if (score < 82.6) return "high";
  return "ok";
}

export function defaultPacingAgreementSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
