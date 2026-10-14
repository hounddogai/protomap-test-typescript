import { classifyMacroSegment } from "../segment/macro-segment-policy.js";
import { MacroSlot } from "../segment/macro-slot.js";
import { MacroSnapshot, newMacroSnapshot } from "./macro-snapshot.js";

export function summarizeMacroSlotsForSnapshot(items: MacroSlot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveMacroSnapshotsFromSlot(items: MacroSlot[]): MacroSnapshot[] {
  const out: MacroSnapshot[] = [];
  for (const item of items) {
    const derived = newMacroSnapshot(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function summarizeMacroSnapshot(item: MacroSnapshot): string {
  return classifyMacroSegment(item.weightedVolume());
}
