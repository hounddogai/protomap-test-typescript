import { normalizeAdaptiveReplyBudgetCode } from "../../reply/variance/adaptive-reply-budget-policy.js";
import { ManualReplyPreference } from "../../reply/variance/manual-reply-preference.js";
import { RollingPostCheckpoint, newRollingPostCheckpoint } from "./rolling-post-checkpoint.js";

export function summarizeManualReplyPreferencesForCheckpoint(items: ManualReplyPreference[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveRollingPostCheckpointsFromPreference(items: ManualReplyPreference[]): RollingPostCheckpoint[] {
  const out: RollingPostCheckpoint[] = [];
  for (const item of items) {
    const derived = newRollingPostCheckpoint(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchRollingPostCheckpoint(item: RollingPostCheckpoint): string {
  return normalizeAdaptiveReplyBudgetCode(item.code);
}
