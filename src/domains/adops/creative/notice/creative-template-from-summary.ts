import { manualCreativeSummaryWeight } from "../creative-allocation/manual-creative-summary-policy.js";
import { ManualCreativeSummary } from "../creative-allocation/manual-creative-summary.js";
import { CreativeTemplate, newCreativeTemplate } from "./creative-template.js";

export function summarizeManualCreativeSummariesForTemplate(items: ManualCreativeSummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function deriveCreativeTemplatesFromSummary(items: ManualCreativeSummary[]): CreativeTemplate[] {
  const out: CreativeTemplate[] = [];
  for (const item of items) {
    const derived = newCreativeTemplate(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreCreativeTemplate(item: CreativeTemplate): number {
  return manualCreativeSummaryWeight(5, true);
}
