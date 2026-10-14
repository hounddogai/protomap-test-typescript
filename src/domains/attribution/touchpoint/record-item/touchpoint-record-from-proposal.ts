import { classifyConversionProposal } from "../../conversion/proposal/conversion-proposal-policy.js";
import { ConversionProposal } from "../../conversion/proposal/conversion-proposal.js";
import { TouchpointRecord, newTouchpointRecord } from "./touchpoint-record.js";

export function summarizeConversionProposalsForRecord(items: ConversionProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.measuredValue());
  }
  return totals;
}

export function deriveTouchpointRecordsFromProposal(items: ConversionProposal[]): TouchpointRecord[] {
  const out: TouchpointRecord[] = [];
  for (const item of items) {
    const derived = newTouchpointRecord(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function computeTouchpointRecord(item: TouchpointRecord): string {
  return classifyConversionProposal(item.projectedValue());
}
