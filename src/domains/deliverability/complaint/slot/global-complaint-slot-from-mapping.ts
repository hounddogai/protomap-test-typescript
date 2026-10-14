import { adaptiveReputationPlanBucket } from "../../reputation/mapping/adaptive-reputation-plan-policy.js";
import { DefaultReputationMapping } from "../../reputation/mapping/default-reputation-mapping.js";
import { GlobalComplaintSlot, newGlobalComplaintSlot } from "./global-complaint-slot.js";

export function summarizeDefaultReputationMappingsForSlot(items: DefaultReputationMapping[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveGlobalComplaintSlotsFromMapping(items: DefaultReputationMapping[]): GlobalComplaintSlot[] {
  const out: GlobalComplaintSlot[] = [];
  for (const item of items) {
    const derived = newGlobalComplaintSlot(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function classifyGlobalComplaintSlotExtra(item: GlobalComplaintSlot): string {
  return adaptiveReputationPlanBucket(item.adjustedVolume());
}
