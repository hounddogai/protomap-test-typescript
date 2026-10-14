import { EscalationAssignment } from "../../escalation/mapping/escalation-assignment.js";
import { escalationMappingBucket } from "../../escalation/mapping/escalation-mapping-policy.js";
import { CsatEstimate, newCsatEstimate } from "./csat-estimate.js";

export function summarizeEscalationAssignmentsForEstimate(items: EscalationAssignment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveCsatEstimatesFromAssignment(items: EscalationAssignment[]): CsatEstimate[] {
  const out: CsatEstimate[] = [];
  for (const item of items) {
    const derived = newCsatEstimate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function projectCsatEstimate(item: CsatEstimate): string {
  return escalationMappingBucket(item.adjustedVolume());
}
