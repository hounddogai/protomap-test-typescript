import { PaywallTarget } from "../../paywall/manifest/paywall-target.js";
import { primaryPaywallManifestWeight } from "../../paywall/manifest/primary-paywall-manifest-policy.js";
import { PendingCohortDraft, newPendingCohortDraft } from "./pending-cohort-draft.js";

export function summarizePaywallTargetsForDraft(items: PaywallTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePendingCohortDraftsFromTarget(items: PaywallTarget[]): PendingCohortDraft[] {
  const out: PendingCohortDraft[] = [];
  for (const item of items) {
    const derived = newPendingCohortDraft(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolvePendingCohortDraft(item: PendingCohortDraft): number {
  return primaryPaywallManifestWeight(4, true);
}
