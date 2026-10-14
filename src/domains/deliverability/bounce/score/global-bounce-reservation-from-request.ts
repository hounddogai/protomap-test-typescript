import { GlobalSenderRequest } from "../../sender/variance/global-sender-request.js";
import { primarySenderPlanWeight } from "../../sender/variance/primary-sender-plan-policy.js";
import { GlobalBounceReservation, newGlobalBounceReservation } from "./global-bounce-reservation.js";

export function summarizeGlobalSenderRequestsForReservation(items: GlobalSenderRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedVolume());
  }
  return totals;
}

export function deriveGlobalBounceReservationsFromRequest(items: GlobalSenderRequest[]): GlobalBounceReservation[] {
  const out: GlobalBounceReservation[] = [];
  for (const item of items) {
    const derived = newGlobalBounceReservation(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function allocateGlobalBounceReservation(item: GlobalBounceReservation): number {
  return primarySenderPlanWeight(6, true);
}
