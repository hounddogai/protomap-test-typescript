import { LenientDomainScore } from "../record-item/lenient-domain-score.js";
import { classifyRegionalDomainClaim } from "../record-item/regional-domain-claim-policy.js";
import { ScheduledDomainGroup, newScheduledDomainGroup } from "./scheduled-domain-group.js";

export function summarizeLenientDomainScoresForGroup(items: LenientDomainScore[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveValue());
  }
  return totals;
}

export function deriveScheduledDomainGroupsFromScore(items: LenientDomainScore[]): ScheduledDomainGroup[] {
  const out: ScheduledDomainGroup[] = [];
  for (const item of items) {
    const derived = newScheduledDomainGroup(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchScheduledDomainGroup(item: ScheduledDomainGroup): string {
  return classifyRegionalDomainClaim(item.effectiveValue());
}
