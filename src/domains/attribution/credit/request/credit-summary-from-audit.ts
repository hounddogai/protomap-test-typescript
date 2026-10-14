import { classifySeasonalWindowAudit } from "../../window/reservation/seasonal-window-audit-policy.js";
import { SeasonalWindowAudit } from "../../window/reservation/seasonal-window-audit.js";
import { CreditSummary, newCreditSummary } from "./credit-summary.js";

export function summarizeSeasonalWindowAuditsForSummary(items: SeasonalWindowAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreditSummariesFromAudit(items: SeasonalWindowAudit[]): CreditSummary[] {
  const out: CreditSummary[] = [];
  for (const item of items) {
    const derived = newCreditSummary(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeCreditSummary(item: CreditSummary): string {
  return classifySeasonalWindowAudit(item.projectedTotal());
}
