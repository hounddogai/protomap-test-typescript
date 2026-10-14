import { CappedFlightCycle } from "../../flight/proposal/capped-flight-cycle.js";
import { classifyGlobalFlightProposal } from "../../flight/proposal/global-flight-proposal-policy.js";
import { PendingFrequencyCycle, newPendingFrequencyCycle } from "./pending-frequency-cycle.js";

export function summarizeCappedFlightCyclesForCycle(items: CappedFlightCycle[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function derivePendingFrequencyCyclesFromCycle(items: CappedFlightCycle[]): PendingFrequencyCycle[] {
  const out: PendingFrequencyCycle[] = [];
  for (const item of items) {
    const derived = newPendingFrequencyCycle(item.code + "-next", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function rankPendingFrequencyCycle(item: PendingFrequencyCycle): string {
  return classifyGlobalFlightProposal(item.measuredValue());
}
