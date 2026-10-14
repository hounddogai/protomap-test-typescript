import { deflectionSlotBucket } from "../../deflection/slot/deflection-slot-policy.js";
import { WeightedDeflectionAudit } from "../../deflection/slot/weighted-deflection-audit.js";
import { EscalationMapping, newEscalationMapping } from "./escalation-mapping.js";

export function summarizeWeightedDeflectionAuditsForMapping(items: WeightedDeflectionAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveEscalationMappingsFromAudit(items: WeightedDeflectionAudit[]): EscalationMapping[] {
  const out: EscalationMapping[] = [];
  for (const item of items) {
    const derived = newEscalationMapping(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeEscalationMapping(item: EscalationMapping): string {
  return deflectionSlotBucket(item.weightedExposure());
}
