import { conversionGroupWeight } from "../../conversion/group/conversion-group-policy.js";
import { ConversionGroup } from "../../conversion/group/conversion-group.js";
import { PathSegment, newPathSegment } from "./path-segment.js";

export function summarizeConversionGroupsForSegment(items: ConversionGroup[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function derivePathSegmentsFromGroup(items: ConversionGroup[]): PathSegment[] {
  const out: PathSegment[] = [];
  for (const item of items) {
    const derived = newPathSegment(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function derivePathSegment(item: PathSegment): number {
  return conversionGroupWeight(3, true);
}
