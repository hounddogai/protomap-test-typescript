import { normalizeCohortDigestCode } from "../../cohort/draft/cohort-digest-policy.js";
import { PendingCohortDraft } from "../../cohort/draft/pending-cohort-draft.js";
import { RegionalActivationBudget, newRegionalActivationBudget } from "./regional-activation-budget.js";

export function summarizePendingCohortDraftsForBudget(items: PendingCohortDraft[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRegionalActivationBudgetsFromDraft(items: PendingCohortDraft[]): RegionalActivationBudget[] {
  const out: RegionalActivationBudget[] = [];
  for (const item of items) {
    const derived = newRegionalActivationBudget(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveRegionalActivationBudget(item: RegionalActivationBudget): string {
  return normalizeCohortDigestCode(item.code);
}
