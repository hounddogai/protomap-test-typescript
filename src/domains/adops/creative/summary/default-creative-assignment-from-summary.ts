import { defaultFrequencyRecordBucket } from "../../frequency/digest/default-frequency-record-policy.js";
import { FrequencySummary } from "../../frequency/digest/frequency-summary.js";
import { DefaultCreativeAssignment, newDefaultCreativeAssignment } from "./default-creative-assignment.js";

export function summarizeFrequencySummariesForAssignment(items: FrequencySummary[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveDefaultCreativeAssignmentsFromSummary(items: FrequencySummary[]): DefaultCreativeAssignment[] {
  const out: DefaultCreativeAssignment[] = [];
  for (const item of items) {
    const derived = newDefaultCreativeAssignment(item.code + "-copy", item.label());
    out.push(derived);
  }
  return out;
}

export function resolveDefaultCreativeAssignment(item: DefaultCreativeAssignment): string {
  return defaultFrequencyRecordBucket(item.netVolume());
}
