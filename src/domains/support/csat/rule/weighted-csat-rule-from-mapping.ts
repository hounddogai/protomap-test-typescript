import {
  normalizeRollingEscalationMappingCode,
} from "../../escalation/manifest/rolling-escalation-mapping-policy.js";
import { RollingEscalationMapping } from "../../escalation/manifest/rolling-escalation-mapping.js";
import { WeightedCsatRule, newWeightedCsatRule } from "./weighted-csat-rule.js";

export function summarizeRollingEscalationMappingsForRule(items: RollingEscalationMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveWeightedCsatRulesFromMapping(items: RollingEscalationMapping[]): WeightedCsatRule[] {
  const out: WeightedCsatRule[] = [];
  for (const item of items) {
    const derived = newWeightedCsatRule(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitWeightedCsatRule(item: WeightedCsatRule): string {
  return normalizeRollingEscalationMappingCode(item.code);
}
