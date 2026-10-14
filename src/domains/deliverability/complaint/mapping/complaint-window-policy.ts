import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeComplaintWindow(): number {
  const policy = retry.defaultPolicy("complaint-window");
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

export function mergeComplaintWindowLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a complaint window score falls in. */
export function classifyComplaintWindow(score: number): string {
  if (score < 16.5) return "elevated";
  if (score < 19.7) return "ok";
  return "medium";
}
