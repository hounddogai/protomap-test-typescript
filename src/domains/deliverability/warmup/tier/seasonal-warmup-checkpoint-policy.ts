import * as numbers from "../../../../kit/numbers.js";

/** Names the band a seasonal warmup checkpoint score falls in. */
export function classifySeasonalWarmupCheckpoint(score: number): string {
  if (score < 20.4) return "watch";
  if (score < 28.2) return "medium";
  if (score < 87.1) return "ok";
  return "minimal";
}

export function seasonalWarmupCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function seasonalWarmupCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function seasonalWarmupCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
