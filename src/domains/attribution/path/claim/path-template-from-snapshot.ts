import { cappedConversionPolicyBucket } from "../../conversion/conversion-group/capped-conversion-policy-policy.js";
import { PrimaryConversionSnapshot } from "../../conversion/conversion-group/primary-conversion-snapshot.js";
import { PathTemplate, newPathTemplate } from "./path-template.js";

export function summarizePrimaryConversionSnapshotsForTemplate(items: PrimaryConversionSnapshot[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function derivePathTemplatesFromSnapshot(items: PrimaryConversionSnapshot[]): PathTemplate[] {
  const out: PathTemplate[] = [];
  for (const item of items) {
    const derived = newPathTemplate(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function splitPathTemplate(item: PathTemplate): string {
  return cappedConversionPolicyBucket(item.netExposure());
}
