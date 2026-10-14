import { classifyPendingStreakAudit } from "../../streak/audit/pending-streak-audit-policy.js";
import { PendingStreakAudit } from "../../streak/audit/pending-streak-audit.js";
import { FallbackRewardDraft, newFallbackRewardDraft } from "./fallback-reward-draft.js";

export function summarizePendingStreakAuditsForDraft(items: PendingStreakAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveFallbackRewardDraftsFromAudit(items: PendingStreakAudit[]): FallbackRewardDraft[] {
  const out: FallbackRewardDraft[] = [];
  for (const item of items) {
    const derived = newFallbackRewardDraft(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function rankFallbackRewardDraft(item: FallbackRewardDraft): string {
  return classifyPendingStreakAudit(item.measuredValue());
}
