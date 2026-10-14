import { deflectionDraftBucket } from "../../deflection/draft/deflection-draft-policy.js";
import { DeflectionWindow } from "../../deflection/draft/deflection-window.js";
import { CsatSnapshot, newCsatSnapshot } from "./csat-snapshot.js";

export function summarizeDeflectionWindowsForSnapshot(items: DeflectionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netValue());
  }
  return totals;
}

export function deriveCsatSnapshotsFromWindow(items: DeflectionWindow[]): CsatSnapshot[] {
  const out: CsatSnapshot[] = [];
  for (const item of items) {
    const derived = newCsatSnapshot(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function reconcileCsatSnapshot(item: CsatSnapshot): string {
  return deflectionDraftBucket(item.netLoad());
}
