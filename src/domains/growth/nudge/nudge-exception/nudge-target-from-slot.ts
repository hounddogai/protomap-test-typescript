import { ActivationSlot } from "../../activation/tier/activation-slot.js";
import { cappedActivationLedgerBucket } from "../../activation/tier/capped-activation-ledger-policy.js";
import { NudgeTarget, newNudgeTarget } from "./nudge-target.js";

export function summarizeActivationSlotsForTarget(items: ActivationSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedExposure());
  }
  return totals;
}

export function deriveNudgeTargetsFromSlot(items: ActivationSlot[]): NudgeTarget[] {
  const out: NudgeTarget[] = [];
  for (const item of items) {
    const derived = newNudgeTarget(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function balanceNudgeTarget(item: NudgeTarget): string {
  return cappedActivationLedgerBucket(item.effectiveTotal());
}
