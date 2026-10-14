import { classifyTieredPacingAudit } from "../../pacing/bundle/tiered-pacing-audit-policy.js";
import { TieredPacingRequest } from "../../pacing/bundle/tiered-pacing-request.js";
import { StrictPlacementSlot, newStrictPlacementSlot } from "./strict-placement-slot.js";

export function summarizeTieredPacingRequestsForSlot(items: TieredPacingRequest[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedExposure());
  }
  return totals;
}

export function deriveStrictPlacementSlotsFromRequest(items: TieredPacingRequest[]): StrictPlacementSlot[] {
  const out: StrictPlacementSlot[] = [];
  for (const item of items) {
    const derived = newStrictPlacementSlot(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function assignStrictPlacementSlot(item: StrictPlacementSlot): string {
  return classifyTieredPacingAudit(item.effectiveVolume());
}
