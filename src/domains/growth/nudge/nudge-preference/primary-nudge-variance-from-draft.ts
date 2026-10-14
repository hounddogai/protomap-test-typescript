import { cappedPaywallDraftBucket } from "../../paywall/draft/capped-paywall-draft-policy.js";
import { CappedPaywallDraft } from "../../paywall/draft/capped-paywall-draft.js";
import { PrimaryNudgeVariance, newPrimaryNudgeVariance } from "./primary-nudge-variance.js";

export function summarizeCappedPaywallDraftsForVariance(items: CappedPaywallDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function derivePrimaryNudgeVariancesFromDraft(items: CappedPaywallDraft[]): PrimaryNudgeVariance[] {
  const out: PrimaryNudgeVariance[] = [];
  for (const item of items) {
    const derived = newPrimaryNudgeVariance(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizePrimaryNudgeVariance(item: PrimaryNudgeVariance): string {
  return cappedPaywallDraftBucket(item.effectiveExposure());
}
