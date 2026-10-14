import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeCappedBidRuleCycleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedBidRuleCycle(): number {
  const policy = retry.defaultPolicy("capped-bid-rule-cycle");
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
