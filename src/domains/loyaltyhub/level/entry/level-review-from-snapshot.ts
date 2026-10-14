import { DefaultLevelSnapshot } from "../notice/default-level-snapshot.js";
import { classifyLevelAudit } from "../notice/level-audit-policy.js";
import { LevelReview, newLevelReview } from "./level-review.js";

export function summarizeDefaultLevelSnapshotsForReview(items: DefaultLevelSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveLevelReviewsFromSnapshot(items: DefaultLevelSnapshot[]): LevelReview[] {
  const out: LevelReview[] = [];
  for (const item of items) {
    const derived = newLevelReview(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchLevelReview(item: LevelReview): string {
  return classifyLevelAudit(item.effectiveVolume());
}
