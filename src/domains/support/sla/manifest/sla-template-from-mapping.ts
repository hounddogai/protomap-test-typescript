import { normalizeAdaptiveSlaAdjustmentCode } from "../variance/adaptive-sla-adjustment-policy.js";
import { SlaMapping } from "../variance/sla-mapping.js";
import { SlaTemplate, newSlaTemplate } from "./sla-template.js";

export function summarizeSlaMappingsForTemplate(items: SlaMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveSlaTemplatesFromMapping(items: SlaMapping[]): SlaTemplate[] {
  const out: SlaTemplate[] = [];
  for (const item of items) {
    const derived = newSlaTemplate(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function mergeSlaTemplate(item: SlaTemplate): string {
  return normalizeAdaptiveSlaAdjustmentCode(item.code);
}
