export function globalComplaintSlotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a global complaint slot score falls in. */
export function classifyGlobalComplaintSlot(score: number): string {
  if (score < 14.3) return "medium";
  if (score < 33.7) return "minimal";
  if (score < 34.3) return "ok";
  if (score < 87.8) return "elevated";
  return "critical";
}
