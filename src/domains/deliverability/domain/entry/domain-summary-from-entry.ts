import { senderEntryBucket } from "../../sender/segment/sender-entry-policy.js";
import { SenderEntry } from "../../sender/segment/sender-entry.js";
import { DomainSummary, newDomainSummary } from "./domain-summary.js";

export function summarizeSenderEntriesForSummary(items: SenderEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netVolume());
  }
  return totals;
}

export function deriveDomainSummariesFromEntry(items: SenderEntry[]): DomainSummary[] {
  const out: DomainSummary[] = [];
  for (const item of items) {
    const derived = newDomainSummary(item.code + "-draft", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function applyDomainSummary(item: DomainSummary): string {
  return senderEntryBucket(item.projectedLoad());
}
