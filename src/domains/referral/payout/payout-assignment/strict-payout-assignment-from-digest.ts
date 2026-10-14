import { GlobalTierDigest } from "../../tier/rule/global-tier-digest.js";
import { normalizeTierRuleCode } from "../../tier/rule/tier-rule-policy.js";
import { StrictPayoutAssignment, newStrictPayoutAssignment } from "./strict-payout-assignment.js";

export function summarizeGlobalTierDigestsForAssignment(items: GlobalTierDigest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveStrictPayoutAssignmentsFromDigest(items: GlobalTierDigest[]): StrictPayoutAssignment[] {
  const out: StrictPayoutAssignment[] = [];
  for (const item of items) {
    const derived = newStrictPayoutAssignment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function matchStrictPayoutAssignment(item: StrictPayoutAssignment): string {
  return normalizeTierRuleCode(item.code);
}
