import { lenientEnrollmentSlotBucket } from "../../enrollment/mapping/lenient-enrollment-slot-policy.js";
import { LenientEnrollmentSlot } from "../../enrollment/mapping/lenient-enrollment-slot.js";
import { PrimaryWaitPolicy, newPrimaryWaitPolicy } from "./primary-wait-policy.js";

export function summarizeLenientEnrollmentSlotsForPolicy(items: LenientEnrollmentSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netLoad());
  }
  return totals;
}

export function derivePrimaryWaitPoliciesFromSlot(items: LenientEnrollmentSlot[]): PrimaryWaitPolicy[] {
  const out: PrimaryWaitPolicy[] = [];
  for (const item of items) {
    const derived = newPrimaryWaitPolicy(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function matchPrimaryWaitPolicy(item: PrimaryWaitPolicy): string {
  return lenientEnrollmentSlotBucket(item.measuredValue());
}
