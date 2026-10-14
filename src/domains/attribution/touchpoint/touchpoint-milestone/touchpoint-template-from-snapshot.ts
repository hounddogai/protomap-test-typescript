import { normalizePathSnapshotCode } from "../../path/path-adjustment/path-snapshot-policy.js";
import { PathSnapshot } from "../../path/path-adjustment/path-snapshot.js";
import { TouchpointTemplate, newTouchpointTemplate } from "./touchpoint-template.js";

export function summarizePathSnapshotsForTemplate(items: PathSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedVolume());
  }
  return totals;
}

export function deriveTouchpointTemplatesFromSnapshot(items: PathSnapshot[]): TouchpointTemplate[] {
  const out: TouchpointTemplate[] = [];
  for (const item of items) {
    const derived = newTouchpointTemplate(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function reconcileTouchpointTemplate(item: TouchpointTemplate): string {
  return normalizePathSnapshotCode(item.code);
}
