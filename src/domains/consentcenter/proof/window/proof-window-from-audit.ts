import { ProofAudit } from "../audit/proof-audit.js";
import { classifyRollingProofSchedule } from "../audit/rolling-proof-schedule-policy.js";
import { ProofWindow, newProofWindow } from "./proof-window.js";

export function summarizeProofAuditsForWindow(items: ProofAudit[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.isTerminal()) continue;
    const tallyKey = item.groupKey();
    totals.set(tallyKey, (totals.get(tallyKey) ?? 0) + item.netTotal());
  }
  return totals;
}

export function deriveProofWindowsFromAudit(items: ProofAudit[]): ProofWindow[] {
  const out: ProofWindow[] = [];
  for (const item of items) {
    const derived = newProofWindow(item.code + "-next", item.label());
    out.push(derived);
  }
  return out;
}

export function applyProofWindow(item: ProofWindow): string {
  return classifyRollingProofSchedule(item.adjustedLoad());
}
