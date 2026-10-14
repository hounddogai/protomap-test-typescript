import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedWarmupReservation(): number {
  const policy = retry.defaultPolicy("capped-warmup-reservation");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a capped warmup reservation score falls in. */
export function classifyCappedWarmupReservation(score: number): string {
  if (score < 45.1) return "ok";
  if (score < 76.6) return "elevated";
  return "medium";
}

export function cappedWarmupReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
