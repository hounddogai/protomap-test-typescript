import { classifyBounceCycle } from "../../bounce/plan/bounce-cycle-policy.js";
import { BounceReservation } from "../../bounce/plan/bounce-reservation.js";
import { SenderQuota, newSenderQuota } from "./sender-quota.js";

export function summarizeBounceReservationsForQuota(items: BounceReservation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveSenderQuotasFromReservation(items: BounceReservation[]): SenderQuota[] {
  const out: SenderQuota[] = [];
  for (const item of items) {
    const derived = newSenderQuota(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreSenderQuota(item: SenderQuota): string {
  return classifyBounceCycle(item.measuredValue());
}
