import { classifyGlobalPathAdjustment } from "../adjustment/global-path-adjustment-policy.js";
import { PathSegment } from "../adjustment/path-segment.js";
import { PathProposal, newPathProposal } from "./path-proposal.js";

export function summarizePathSegmentsForProposal(items: PathSegment[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function derivePathProposalsFromSegment(items: PathSegment[]): PathProposal[] {
  const out: PathProposal[] = [];
  for (const item of items) {
    const derived = newPathProposal(item.code + "-plan", item.label());
    out.push(derived);
  }
  return out;
}

export function matchPathProposal(item: PathProposal): string {
  return classifyGlobalPathAdjustment(item.measuredValue());
}
