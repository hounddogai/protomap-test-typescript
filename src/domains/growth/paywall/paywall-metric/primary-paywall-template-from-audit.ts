import { CohortAudit } from "../../cohort/audit/cohort-audit.js";
import { normalizeSeasonalCohortSummaryCode } from "../../cohort/audit/seasonal-cohort-summary-policy.js";
import { PrimaryPaywallTemplate, newPrimaryPaywallTemplate } from "./primary-paywall-template.js";

export function summarizeCohortAuditsForTemplate(items: CohortAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function derivePrimaryPaywallTemplatesFromAudit(items: CohortAudit[]): PrimaryPaywallTemplate[] {
  const out: PrimaryPaywallTemplate[] = [];
  for (const item of items) {
    const derived = newPrimaryPaywallTemplate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyPrimaryPaywallTemplateExtra(item: PrimaryPaywallTemplate): string {
  return normalizeSeasonalCohortSummaryCode(item.code);
}
