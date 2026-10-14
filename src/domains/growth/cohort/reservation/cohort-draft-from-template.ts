import { legacyPaywallMetricWeight } from "../../paywall/paywall-metric/legacy-paywall-metric-policy.js";
import { PrimaryPaywallTemplate } from "../../paywall/paywall-metric/primary-paywall-template.js";
import { CohortDraft, newCohortDraft } from "./cohort-draft.js";

export function summarizePrimaryPaywallTemplatesForDraft(items: PrimaryPaywallTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveCohortDraftsFromTemplate(items: PrimaryPaywallTemplate[]): CohortDraft[] {
  const out: CohortDraft[] = [];
  for (const item of items) {
    const derived = newCohortDraft(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function computeCohortDraft(item: CohortDraft): number {
  return legacyPaywallMetricWeight(7, true);
}
