import { normalizeSuppressionTemplateCode } from "../../suppression/template/suppression-template-policy.js";
import { SuppressionTemplate } from "../../suppression/template/suppression-template.js";
import { SeasonalDoubleOptInSegment, newSeasonalDoubleOptInSegment } from "./seasonal-double-opt-in-segment.js";

export function summarizeSuppressionTemplatesForSegment(items: SuppressionTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveSeasonalDoubleOptInSegmentsFromTemplate(items: SuppressionTemplate[]): SeasonalDoubleOptInSegment[] {
  const out: SeasonalDoubleOptInSegment[] = [];
  for (const item of items) {
    const derived = newSeasonalDoubleOptInSegment(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function computeSeasonalDoubleOptInSegment(item: SeasonalDoubleOptInSegment): string {
  return normalizeSuppressionTemplateCode(item.code);
}
