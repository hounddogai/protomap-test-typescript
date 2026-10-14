import { classifyGlobalWindowLedger } from "../../window/ledger/global-window-ledger-policy.js";
import { ManualWindowProposal } from "../../window/ledger/manual-window-proposal.js";
import { ConversionSummary, newConversionSummary } from "./conversion-summary.js";

export function summarizeManualWindowProposalsForSummary(items: ManualWindowProposal[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.adjustedLoad());
  }
  return totals;
}

export function deriveConversionSummariesFromProposal(items: ManualWindowProposal[]): ConversionSummary[] {
  const out: ConversionSummary[] = [];
  for (const item of items) {
    const derived = newConversionSummary(item.code + "-plan", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function scoreConversionSummary(item: ConversionSummary): string {
  return classifyGlobalWindowLedger(item.measuredValue());
}
