import { normalizeSeasonalCsatTemplateCode } from "../../csat/template/seasonal-csat-template-policy.js";
import { SeasonalCsatTemplate } from "../../csat/template/seasonal-csat-template.js";
import { ManualDeflectionReservation, newManualDeflectionReservation } from "./manual-deflection-reservation.js";

export function summarizeSeasonalCsatTemplatesForReservation(items: SeasonalCsatTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveExposure());
  }
  return totals;
}

export function deriveManualDeflectionReservationsFromTemplate(items: SeasonalCsatTemplate[]): ManualDeflectionReservation[] {
  const out: ManualDeflectionReservation[] = [];
  for (const item of items) {
    const derived = newManualDeflectionReservation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function resolveManualDeflectionReservation(item: ManualDeflectionReservation): string {
  return normalizeSeasonalCsatTemplateCode(item.code);
}
