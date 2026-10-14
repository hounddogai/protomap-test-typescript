import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a model variance score falls in. */
export function classifyModelVariance(score: number): string {
  if (score < 26.5) return "critical";
  if (score < 29.3) return "elevated";
  if (score < 59.7) return "high";
  return "minimal";
}

export function mergeModelVarianceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeModelVariance(): number {
  const policy = retry.defaultPolicy("model-variance");
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
