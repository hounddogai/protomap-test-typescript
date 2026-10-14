import { cohortDigestBucket } from "../../cohort/draft/cohort-digest-policy.js";
import { CohortDigest } from "../../cohort/draft/cohort-digest.js";
import { ManualNudgeBaseline, newManualNudgeBaseline } from "./manual-nudge-baseline.js";

export function summarizeCohortDigestsForBaseline(items: CohortDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveManualNudgeBaselinesFromDigest(items: CohortDigest[]): ManualNudgeBaseline[] {
  const out: ManualNudgeBaseline[] = [];
  for (const item of items) {
    const derived = newManualNudgeBaseline(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeManualNudgeBaseline(item: ManualNudgeBaseline): string {
  return cohortDigestBucket(item.measuredValue());
}
