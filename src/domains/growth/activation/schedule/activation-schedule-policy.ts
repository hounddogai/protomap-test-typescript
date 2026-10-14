import * as numbers from "../../../../kit/numbers.js";

export function activationScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function activationScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function activationScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a activation schedule score falls in. */
export function classifyActivationSchedule(score: number): string {
  if (score < 6) return "low";
  if (score < 36.5) return "high";
  if (score < 76) return "ok";
  return "critical";
}
