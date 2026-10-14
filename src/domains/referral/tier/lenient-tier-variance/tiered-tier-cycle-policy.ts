import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredTierCycle(): number {
  const policy = retry.defaultPolicy("tiered-tier-cycle");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function tieredTierCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a tiered tier cycle score falls in. */
export function classifyTieredTierCycle(score: number): string {
  if (score < 37.6) return "minimal";
  if (score < 53.9) return "watch";
  if (score < 60.5) return "high";
  if (score < 96) return "ok";
  return "critical";
}

export function mergeTieredTierCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
