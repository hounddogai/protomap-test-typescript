import { normalizeGlobalCsatTemplateCode } from "../../csat/rule/global-csat-template-policy.js";
import { GlobalCsatTemplate } from "../../csat/rule/global-csat-template.js";
import { AdaptiveMacroCheckpoint, newAdaptiveMacroCheckpoint } from "./adaptive-macro-checkpoint.js";

export function summarizeGlobalCsatTemplatesForCheckpoint(items: GlobalCsatTemplate[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedLoad());
  }
  return totals;
}

export function deriveAdaptiveMacroCheckpointsFromTemplate(items: GlobalCsatTemplate[]): AdaptiveMacroCheckpoint[] {
  const out: AdaptiveMacroCheckpoint[] = [];
  for (const item of items) {
    const derived = newAdaptiveMacroCheckpoint(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeAdaptiveMacroCheckpoint(item: AdaptiveMacroCheckpoint): string {
  return normalizeGlobalCsatTemplateCode(item.code);
}
