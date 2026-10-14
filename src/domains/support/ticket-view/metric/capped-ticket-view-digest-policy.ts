import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeCappedTicketViewDigestLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a capped ticket view digest score falls in. */
export function classifyCappedTicketViewDigest(score: number): string {
  if (score < 16) return "elevated";
  if (score < 83.2) return "critical";
  if (score < 85.9) return "watch";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedTicketViewDigest(): number {
  const policy = retry.defaultPolicy("capped-ticket-view-digest");
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

/** Counts how many amounts fit in a budget of 12256.0, in order. */
export function cappedTicketViewDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12256) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
