import { WindowEntry } from "../../window/entry/window-entry.js";
import { windowProfileWeight } from "../../window/entry/window-profile-policy.js";
import { ConversionReservation, newConversionReservation } from "./conversion-reservation.js";

export function summarizeWindowEntriesForReservation(items: WindowEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netExposure());
  }
  return totals;
}

export function deriveConversionReservationsFromEntry(items: WindowEntry[]): ConversionReservation[] {
  const out: ConversionReservation[] = [];
  for (const item of items) {
    const derived = newConversionReservation(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function estimateConversionReservation(item: ConversionReservation): number {
  return windowProfileWeight(3, true);
}
