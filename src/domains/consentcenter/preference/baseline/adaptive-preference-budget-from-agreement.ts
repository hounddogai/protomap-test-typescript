import { FallbackOptOutAgreement } from "../../opt-out/profile/fallback-opt-out-agreement.js";
import { optOutProfileWeight } from "../../opt-out/profile/opt-out-profile-policy.js";
import { AdaptivePreferenceBudget, newAdaptivePreferenceBudget } from "./adaptive-preference-budget.js";

export function summarizeFallbackOptOutAgreementsForBudget(items: FallbackOptOutAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveAdaptivePreferenceBudgetsFromAgreement(items: FallbackOptOutAgreement[]): AdaptivePreferenceBudget[] {
  const out: AdaptivePreferenceBudget[] = [];
  for (const item of items) {
    const derived = newAdaptivePreferenceBudget(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreAdaptivePreferenceBudget(item: AdaptivePreferenceBudget): number {
  return optOutProfileWeight(1, true);
}
