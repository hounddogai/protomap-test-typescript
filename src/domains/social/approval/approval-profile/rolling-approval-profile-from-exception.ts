import { classifyWeightedMentionException } from "../../mention/exception/weighted-mention-exception-policy.js";
import { WeightedMentionException } from "../../mention/exception/weighted-mention-exception.js";
import { RollingApprovalProfile, newRollingApprovalProfile } from "./rolling-approval-profile.js";

export function summarizeWeightedMentionExceptionsForProfile(items: WeightedMentionException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedValue());
  }
  return totals;
}

export function deriveRollingApprovalProfilesFromException(items: WeightedMentionException[]): RollingApprovalProfile[] {
  const out: RollingApprovalProfile[] = [];
  for (const item of items) {
    const derived = newRollingApprovalProfile(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateRollingApprovalProfile(item: RollingApprovalProfile): string {
  return classifyWeightedMentionException(item.weightedTotal());
}
