import { normalizeBranchBatchCode } from "../../branch/bundle/branch-batch-policy.js";
import { BranchDigest } from "../../branch/bundle/branch-digest.js";
import { JourneyAudit, newJourneyAudit } from "./journey-audit.js";

export function summarizeBranchDigestsForAudit(items: BranchDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveJourneyAuditsFromDigest(items: BranchDigest[]): JourneyAudit[] {
  const out: JourneyAudit[] = [];
  for (const item of items) {
    const derived = newJourneyAudit(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveJourneyAudit(item: JourneyAudit): string {
  return normalizeBranchBatchCode(item.code);
}
