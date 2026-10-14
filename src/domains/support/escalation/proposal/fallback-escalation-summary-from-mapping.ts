import {
  classifyCappedDeflectionTemplate,
} from "../../deflection/deflection-manifest/capped-deflection-template-policy.js";
import { DeflectionMapping } from "../../deflection/deflection-manifest/deflection-mapping.js";
import { FallbackEscalationSummary, newFallbackEscalationSummary } from "./fallback-escalation-summary.js";

export function summarizeDeflectionMappingsForSummary(items: DeflectionMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveFallbackEscalationSummariesFromMapping(items: DeflectionMapping[]): FallbackEscalationSummary[] {
  const out: FallbackEscalationSummary[] = [];
  for (const item of items) {
    const derived = newFallbackEscalationSummary(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function matchFallbackEscalationSummary(item: FallbackEscalationSummary): string {
  return classifyCappedDeflectionTemplate(item.netTotal());
}
