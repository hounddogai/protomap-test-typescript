import { ProofAssignment } from "../../proof/target/proof-assignment.js";
import { classifyProofTarget } from "../../proof/target/proof-target-policy.js";
import { DoubleOptInRule, newDoubleOptInRule } from "./double-opt-in-rule.js";

export function summarizeProofAssignmentsForRule(items: ProofAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedValue());
  }
  return totals;
}

export function deriveDoubleOptInRulesFromAssignment(items: ProofAssignment[]): DoubleOptInRule[] {
  const out: DoubleOptInRule[] = [];
  for (const item of items) {
    const derived = newDoubleOptInRule(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function planDoubleOptInRule(item: DoubleOptInRule): string {
  return classifyProofTarget(item.measuredValue());
}
