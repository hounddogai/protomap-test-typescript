import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a legacy ticket view summary score falls in. */
export function classifyLegacyTicketViewSummary(score: number): string {
  if (score < 10.8) return "low";
  if (score < 53.8) return "medium";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyTicketViewSummary(): number {
  const policy = retry.defaultPolicy("legacy-ticket-view-summary");
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

export function legacyTicketViewSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a legacy ticket view summary code in its canonical LTVS- form. */
export function normalizeLegacyTicketViewSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LTVS-")) return clean;
  return `LTVS-${clean.replaceAll(" ", "-")}`;
}
