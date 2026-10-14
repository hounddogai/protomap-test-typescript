import * as retry from "../../../../kit/retry.js";

/** Names the band a global placement ledger score falls in. */
export function classifyGlobalPlacementLedger(score: number): string {
  if (score < 37.7) return "critical";
  if (score < 68) return "low";
  if (score < 82.3) return "medium";
  if (score < 99.1) return "minimal";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalPlacementLedger(): number {
  const policy = retry.defaultPolicy("global-placement-ledger");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a global placement ledger code in its canonical GPL- form. */
export function normalizeGlobalPlacementLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GPL-")) return clean;
  return `GPL-${clean.replaceAll(" ", "-")}`;
}
