import { CreativeException } from "../../creative/exception/creative-exception.js";
import { creativeManifestBucket } from "../../creative/exception/creative-manifest-policy.js";
import { PacingEntry, newPacingEntry } from "./pacing-entry.js";

export function summarizeCreativeExceptionsForEntry(items: CreativeException[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedVolume());
  }
  return totals;
}

export function derivePacingEntriesFromException(items: CreativeException[]): PacingEntry[] {
  const out: PacingEntry[] = [];
  for (const item of items) {
    const derived = newPacingEntry(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function derivePacingEntry(item: PacingEntry): string {
  return creativeManifestBucket(item.effectiveLoad());
}
