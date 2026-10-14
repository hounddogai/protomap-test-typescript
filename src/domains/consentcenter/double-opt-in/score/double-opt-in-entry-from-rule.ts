import { CappedProofRule } from "../../proof/rule/capped-proof-rule.js";
import { normalizeProofRuleCode } from "../../proof/rule/proof-rule-policy.js";
import { DoubleOptInEntry, newDoubleOptInEntry } from "./double-opt-in-entry.js";

export function summarizeCappedProofRulesForEntry(items: CappedProofRule[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedTotal());
  }
  return totals;
}

export function deriveDoubleOptInEntriesFromRule(items: CappedProofRule[]): DoubleOptInEntry[] {
  const out: DoubleOptInEntry[] = [];
  for (const item of items) {
    const derived = newDoubleOptInEntry(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function mergeDoubleOptInEntry(item: DoubleOptInEntry): string {
  return normalizeProofRuleCode(item.code);
}
