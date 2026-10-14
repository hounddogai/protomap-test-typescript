import { batchedWindowCheckpointWeight } from "../../window/profile/batched-window-checkpoint-policy.js";
import { StrictWindowProfile } from "../../window/profile/strict-window-profile.js";
import { CreditAssignment, newCreditAssignment } from "./credit-assignment.js";

export function summarizeStrictWindowProfilesForAssignment(items: StrictWindowProfile[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveCreditAssignmentsFromProfile(items: StrictWindowProfile[]): CreditAssignment[] {
  const out: CreditAssignment[] = [];
  for (const item of items) {
    const derived = newCreditAssignment(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function applyCreditAssignment(item: CreditAssignment): number {
  return batchedWindowCheckpointWeight(7, true);
}
