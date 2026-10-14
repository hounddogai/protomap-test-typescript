import { normalizeSeasonalCsatTemplateCode } from "../../csat/template/seasonal-csat-template-policy.js";
import { SeasonalCsatTemplate } from "../../csat/template/seasonal-csat-template.js";
import { PrimarySlaPlan, newPrimarySlaPlan } from "./primary-sla-plan.js";

export function summarizeSeasonalCsatTemplatesForPlan(items: SeasonalCsatTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function derivePrimarySlaPlansFromTemplate(items: SeasonalCsatTemplate[]): PrimarySlaPlan[] {
  const out: PrimarySlaPlan[] = [];
  for (const item of items) {
    const derived = newPrimarySlaPlan(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergePrimarySlaPlan(item: PrimarySlaPlan): string {
  return normalizeSeasonalCsatTemplateCode(item.code);
}
