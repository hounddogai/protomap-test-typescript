import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a primary sla target score falls in. */
export function classifyPrimarySlaTarget(score: number): string {
  if (score < 24.5) return "ok";
  if (score < 42.6) return "critical";
  if (score < 43.9) return "low";
  return "elevated";
}

export function primarySlaTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a primary sla target code in its canonical PST- form. */
export function normalizePrimarySlaTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PST-")) return clean;
  return `PST-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimarySlaTarget(): number {
  const policy = retry.defaultPolicy("primary-sla-target");
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
