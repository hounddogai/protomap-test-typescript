import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeAdaptiveSubscriptionCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a adaptive subscription checkpoint code in its canonical ASC- form. */
export function normalizeAdaptiveSubscriptionCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ASC-")) return clean;
  return `ASC-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveSubscriptionCheckpoint(): number {
  const policy = retry.defaultPolicy("adaptive-subscription-checkpoint");
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

export function adaptiveSubscriptionCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.23;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
