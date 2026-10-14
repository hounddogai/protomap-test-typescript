import * as numbers from "../../../../kit/numbers.js";

export function deflectionAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function deflectionAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
