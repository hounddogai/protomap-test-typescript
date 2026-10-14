import { cappedDomainMappingWeight } from "../mapping/capped-domain-mapping-policy.js";
import { DomainScore } from "../mapping/domain-score.js";
import { RollingDomainMapping, newRollingDomainMapping } from "./rolling-domain-mapping.js";

export function summarizeDomainScoresForMapping(items: DomainScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveRollingDomainMappingsFromScore(items: DomainScore[]): RollingDomainMapping[] {
  const out: RollingDomainMapping[] = [];
  for (const item of items) {
    const derived = newRollingDomainMapping(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeRollingDomainMapping(item: RollingDomainMapping): number {
  return cappedDomainMappingWeight(3, true);
}
