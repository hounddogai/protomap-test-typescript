import { creativeExceptionWeight } from "../../creative/exception/creative-exception-policy.js";
import { CreativeException } from "../../creative/exception/creative-exception.js";
import { FlightCheckpoint, newFlightCheckpoint } from "./flight-checkpoint.js";

export function summarizeCreativeExceptionsForCheckpoint(items: CreativeException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function deriveFlightCheckpointsFromException(items: CreativeException[]): FlightCheckpoint[] {
  const out: FlightCheckpoint[] = [];
  for (const item of items) {
    const derived = newFlightCheckpoint(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function matchFlightCheckpoint(item: FlightCheckpoint): number {
  return creativeExceptionWeight(9, true);
}
