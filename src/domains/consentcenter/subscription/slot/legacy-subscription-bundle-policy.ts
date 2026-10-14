import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacySubscriptionBundleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function legacySubscriptionBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a legacy subscription bundle score falls in. */
export function classifyLegacySubscriptionBundle(score: number): string {
  if (score < 47.7) return "high";
  if (score < 47.7) return "critical";
  if (score < 51.4) return "medium";
  if (score < 57.3) return "watch";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacySubscriptionBundle(): number {
  const policy = retry.defaultPolicy("legacy-subscription-bundle");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
