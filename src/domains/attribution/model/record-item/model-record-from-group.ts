import { modelCheckpointWeight } from "../checkpoint/model-checkpoint-policy.js";
import { ModelGroup } from "../checkpoint/model-group.js";
import { ModelRecord, newModelRecord } from "./model-record.js";

export function summarizeModelGroupsForRecord(items: ModelGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveModelRecordsFromGroup(items: ModelGroup[]): ModelRecord[] {
  const out: ModelRecord[] = [];
  for (const item of items) {
    const derived = newModelRecord(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileModelRecord(item: ModelRecord): number {
  return modelCheckpointWeight(9, true);
}
