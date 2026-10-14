import { LenientRetentionDraft } from "../../retention/bundle/lenient-retention-draft.js";
import { seasonalRetentionBundleBucket } from "../../retention/bundle/seasonal-retention-bundle-policy.js";
import { RollingNudgeCheckpoint, newRollingNudgeCheckpoint } from "./rolling-nudge-checkpoint.js";

export function summarizeLenientRetentionDraftsForCheckpoint(items: LenientRetentionDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveRollingNudgeCheckpointsFromDraft(items: LenientRetentionDraft[]): RollingNudgeCheckpoint[] {
  const out: RollingNudgeCheckpoint[] = [];
  for (const item of items) {
    const derived = newRollingNudgeCheckpoint(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyRollingNudgeCheckpointExtra(item: RollingNudgeCheckpoint): string {
  return seasonalRetentionBundleBucket(item.adjustedValue());
}
