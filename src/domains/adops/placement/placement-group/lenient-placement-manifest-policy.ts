import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientPlacementManifest(): number {
  const policy = retry.defaultPolicy("lenient-placement-manifest");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function mergeLenientPlacementManifestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 13117.0, in order. */
export function lenientPlacementManifestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 13117) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient placement manifest score falls in. */
export function classifyLenientPlacementManifest(score: number): string {
  if (score < 27.2) return "ok";
  if (score < 30.2) return "minimal";
  if (score < 56.6) return "critical";
  if (score < 81) return "medium";
  return "watch";
}
