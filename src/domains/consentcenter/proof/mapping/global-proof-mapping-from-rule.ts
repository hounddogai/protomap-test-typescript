import { classifyProofRule } from "../rule/proof-rule-policy.js";
import { ProofRule } from "../rule/proof-rule.js";
import { GlobalProofMapping, newGlobalProofMapping } from "./global-proof-mapping.js";

export function summarizeProofRulesForMapping(items: ProofRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveGlobalProofMappingsFromRule(items: ProofRule[]): GlobalProofMapping[] {
  const out: GlobalProofMapping[] = [];
  for (const item of items) {
    const derived = newGlobalProofMapping(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignGlobalProofMapping(item: GlobalProofMapping): string {
  return classifyProofRule(item.weightedExposure());
}
