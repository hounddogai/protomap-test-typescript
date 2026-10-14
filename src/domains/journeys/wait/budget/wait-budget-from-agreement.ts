import { JourneyAgreement } from "../../journey/audit/journey-agreement.js";
import { classifyJourneyAudit } from "../../journey/audit/journey-audit-policy.js";
import { WaitBudget, newWaitBudget } from "./wait-budget.js";

export function summarizeJourneyAgreementsForBudget(items: JourneyAgreement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveWaitBudgetsFromAgreement(items: JourneyAgreement[]): WaitBudget[] {
  const out: WaitBudget[] = [];
  for (const item of items) {
    const derived = newWaitBudget(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignWaitBudget(item: WaitBudget): string {
  return classifyJourneyAudit(item.projectedVolume());
}
