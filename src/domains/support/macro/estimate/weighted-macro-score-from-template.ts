import { normalizeScheduledMacroTemplateCode } from "../macro-score/scheduled-macro-template-policy.js";
import { ScheduledMacroTemplate } from "../macro-score/scheduled-macro-template.js";
import { WeightedMacroScore, newWeightedMacroScore } from "./weighted-macro-score.js";

export function summarizeScheduledMacroTemplatesForScore(items: ScheduledMacroTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWeightedMacroScoresFromTemplate(items: ScheduledMacroTemplate[]): WeightedMacroScore[] {
  const out: WeightedMacroScore[] = [];
  for (const item of items) {
    const derived = newWeightedMacroScore(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function planWeightedMacroScore(item: WeightedMacroScore): string {
  return normalizeScheduledMacroTemplateCode(item.code);
}
