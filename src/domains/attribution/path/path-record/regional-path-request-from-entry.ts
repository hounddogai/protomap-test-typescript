import { pathWindowWeight } from "../path-milestone/path-window-policy.js";
import { StrictPathEntry } from "../path-milestone/strict-path-entry.js";
import { RegionalPathRequest, newRegionalPathRequest } from "./regional-path-request.js";

export function summarizeStrictPathEntriesForRequest(items: StrictPathEntry[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.weightedLoad());
  }
  return totals;
}

export function deriveRegionalPathRequestsFromEntry(items: StrictPathEntry[]): RegionalPathRequest[] {
  const out: RegionalPathRequest[] = [];
  for (const item of items) {
    const derived = newRegionalPathRequest(item.code + "-draft", item.label());
    out.push(derived);
  }
  return out;
}

export function summarizeRegionalPathRequest(item: RegionalPathRequest): number {
  return pathWindowWeight(4, true);
}
