import { ModelCheckpoint } from "../../model/checkpoint/model-checkpoint.js";
import { normalizeModelTemplateCode } from "../../model/checkpoint/model-template-policy.js";
import { WindowEntry, newWindowEntry } from "./window-entry.js";

export function summarizeModelCheckpointsForEntry(items: ModelCheckpoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveWindowEntriesFromCheckpoint(items: ModelCheckpoint[]): WindowEntry[] {
  const out: WindowEntry[] = [];
  for (const item of items) {
    const derived = newWindowEntry(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function estimateWindowEntry(item: WindowEntry): string {
  return normalizeModelTemplateCode(item.code);
}
