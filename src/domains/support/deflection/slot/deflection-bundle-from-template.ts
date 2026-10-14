import { normalizeCsatTemplateCode } from "../../csat/draft/csat-template-policy.js";
import { CsatTemplate } from "../../csat/draft/csat-template.js";
import { DeflectionBundle, newDeflectionBundle } from "./deflection-bundle.js";

export function summarizeCsatTemplatesForBundle(items: CsatTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveDeflectionBundlesFromTemplate(items: CsatTemplate[]): DeflectionBundle[] {
  const out: DeflectionBundle[] = [];
  for (const item of items) {
    const derived = newDeflectionBundle(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyDeflectionBundle(item: DeflectionBundle): string {
  return normalizeCsatTemplateCode(item.code);
}
