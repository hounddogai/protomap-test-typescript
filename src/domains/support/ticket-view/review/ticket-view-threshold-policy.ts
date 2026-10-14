import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a ticket view threshold score falls in. */
export function classifyTicketViewThreshold(score: number): string {
  if (score < 70.1) return "elevated";
  if (score < 70.6) return "medium";
  if (score < 70.7) return "ok";
  if (score < 96.3) return "low";
  return "high";
}

export function mergeTicketViewThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTicketViewThreshold(): number {
  const policy = retry.defaultPolicy("ticket-view-threshold");
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
