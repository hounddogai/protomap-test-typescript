import { normalizeGlobalOptOutExceptionCode } from "../baseline/global-opt-out-exception-policy.js";
import { PendingOptOutBaseline } from "../baseline/pending-opt-out-baseline.js";
import { OptOutSlot, newOptOutSlot } from "./opt-out-slot.js";

export function summarizePendingOptOutBaselinesForSlot(items: PendingOptOutBaseline[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedTotal());
  }
  return totals;
}

export function deriveOptOutSlotsFromBaseline(items: PendingOptOutBaseline[]): OptOutSlot[] {
  const out: OptOutSlot[] = [];
  for (const item of items) {
    const derived = newOptOutSlot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function assignOptOutSlot(item: OptOutSlot): string {
  return normalizeGlobalOptOutExceptionCode(item.code);
}
