import { PacingAllocation } from "../../pacing/target/pacing-allocation.js";
import { scheduledPacingTargetBucket } from "../../pacing/target/scheduled-pacing-target-policy.js";
import { CreativeLedger, newCreativeLedger } from "./creative-ledger.js";

export function summarizePacingAllocationsForLedger(items: PacingAllocation[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveCreativeLedgersFromAllocation(items: PacingAllocation[]): CreativeLedger[] {
  const out: CreativeLedger[] = [];
  for (const item of items) {
    const derived = newCreativeLedger(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function allocateCreativeLedger(item: CreativeLedger): string {
  return scheduledPacingTargetBucket(item.netTotal());
}
