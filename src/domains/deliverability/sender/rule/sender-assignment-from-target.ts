import { seasonalDomainTargetBucket } from "../../domain/domain-target/seasonal-domain-target-policy.js";
import { SeasonalDomainTarget } from "../../domain/domain-target/seasonal-domain-target.js";
import { SenderAssignment, newSenderAssignment } from "./sender-assignment.js";

export function summarizeSeasonalDomainTargetsForAssignment(items: SeasonalDomainTarget[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveSenderAssignmentsFromTarget(items: SeasonalDomainTarget[]): SenderAssignment[] {
  const out: SenderAssignment[] = [];
  for (const item of items) {
    const derived = newSenderAssignment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function classifySenderAssignment(item: SenderAssignment): string {
  return seasonalDomainTargetBucket(item.projectedExposure());
}
