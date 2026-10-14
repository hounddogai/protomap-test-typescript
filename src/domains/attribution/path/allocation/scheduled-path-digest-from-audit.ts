import { classifyDefaultPathDraft } from "../draft/default-path-draft-policy.js";
import { ManualPathAudit } from "../draft/manual-path-audit.js";
import { ScheduledPathDigest, newScheduledPathDigest } from "./scheduled-path-digest.js";

export function summarizeManualPathAuditsForDigest(items: ManualPathAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveScheduledPathDigestsFromAudit(items: ManualPathAudit[]): ScheduledPathDigest[] {
  const out: ScheduledPathDigest[] = [];
  for (const item of items) {
    const derived = newScheduledPathDigest(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function deriveScheduledPathDigest(item: ScheduledPathDigest): string {
  return classifyDefaultPathDraft(item.weightedVolume());
}
