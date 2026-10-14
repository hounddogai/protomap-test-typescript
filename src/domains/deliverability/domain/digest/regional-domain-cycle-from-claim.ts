import { ScheduledSenderClaim } from "../../sender/rule/scheduled-sender-claim.js";
import { senderAssignmentBucket } from "../../sender/rule/sender-assignment-policy.js";
import { RegionalDomainCycle, newRegionalDomainCycle } from "./regional-domain-cycle.js";

export function summarizeScheduledSenderClaimsForCycle(items: ScheduledSenderClaim[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedValue());
  }
  return totals;
}

export function deriveRegionalDomainCyclesFromClaim(items: ScheduledSenderClaim[]): RegionalDomainCycle[] {
  const out: RegionalDomainCycle[] = [];
  for (const item of items) {
    const derived = newRegionalDomainCycle(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceRegionalDomainCycle(item: RegionalDomainCycle): string {
  return senderAssignmentBucket(item.projectedExposure());
}
