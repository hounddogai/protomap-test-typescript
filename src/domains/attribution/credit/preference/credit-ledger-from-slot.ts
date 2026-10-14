import { normalizeRegionalCreditSlotCode } from "../proposal/regional-credit-slot-policy.js";
import { RegionalCreditSlot } from "../proposal/regional-credit-slot.js";
import { CreditLedger, newCreditLedger } from "./credit-ledger.js";

export function summarizeRegionalCreditSlotsForLedger(items: RegionalCreditSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveVolume());
  }
  return totals;
}

export function deriveCreditLedgersFromSlot(items: RegionalCreditSlot[]): CreditLedger[] {
  const out: CreditLedger[] = [];
  for (const item of items) {
    const derived = newCreditLedger(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function scoreCreditLedger(item: CreditLedger): string {
  return normalizeRegionalCreditSlotCode(item.code);
}
