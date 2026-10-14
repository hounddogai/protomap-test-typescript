import { classifySuppressionWindow } from "../../suppression/window/suppression-window-policy.js";
import { SuppressionWindow } from "../../suppression/window/suppression-window.js";
import { preferenceTargetWeight } from "../assignment/preference-target-policy.js";
import { PreferenceWindow } from "../assignment/preference-window.js";
import { FallbackPreferenceProposal, newFallbackPreferenceProposal } from "./fallback-preference-proposal.js";

export function summarizeSuppressionWindowsForProposal(items: SuppressionWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.projectedExposure());
  }
  return totals;
}

export function deriveFallbackPreferenceProposalsFromWindow(items: SuppressionWindow[]): FallbackPreferenceProposal[] {
  const out: FallbackPreferenceProposal[] = [];
  for (const item of items) {
    const derived = newFallbackPreferenceProposal(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function classifyFallbackPreferenceProposal(item: FallbackPreferenceProposal): string {
  return classifySuppressionWindow(item.weightedVolume());
}

export function summarizePreferenceWindowsForProposal(items: PreferenceWindow[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.effectiveTotal());
  }
  return totals;
}

export function deriveFallbackPreferenceProposalsFromWindowExtra(items: PreferenceWindow[]): FallbackPreferenceProposal[] {
  const out: FallbackPreferenceProposal[] = [];
  for (const item of items) {
    const derived = newFallbackPreferenceProposal(item.code + "-copy", item.displayLabel());
    out.push(derived);
  }
  return out;
}

export function assignFallbackPreferenceProposal(item: FallbackPreferenceProposal): number {
  return preferenceTargetWeight(8, true);
}
