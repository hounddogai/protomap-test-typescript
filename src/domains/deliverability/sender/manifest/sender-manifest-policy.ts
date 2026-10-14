import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSenderManifest(): number {
  const policy = retry.defaultPolicy("sender-manifest");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function senderManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a sender manifest score falls in. */
export function classifySenderManifest(score: number): string {
  if (score < 21.8) return "medium";
  if (score < 43.6) return "minimal";
  if (score < 55.9) return "ok";
  return "critical";
}
