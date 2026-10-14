import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeExitRuleRecord(): number {
  const policy = retry.defaultPolicy("exit-rule-record");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a exit rule record score falls in. */
export function classifyExitRuleRecord(score: number): string {
  if (score < 7.4) return "watch";
  if (score < 51.3) return "ok";
  return "minimal";
}

/** Puts a exit rule record code in its canonical ERR- form. */
export function normalizeExitRuleRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERR-")) return clean;
  return `ERR-${clean.replaceAll(" ", "-")}`;
}
