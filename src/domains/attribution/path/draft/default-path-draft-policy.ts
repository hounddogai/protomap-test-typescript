import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultPathDraft(): number {
  const policy = retry.defaultPolicy("default-path-draft");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a default path draft score falls in. */
export function classifyDefaultPathDraft(score: number): string {
  if (score < 8.3) return "low";
  if (score < 63.8) return "medium";
  if (score < 90.7) return "minimal";
  return "watch";
}

/** Puts a default path draft code in its canonical DPD- form. */
export function normalizeDefaultPathDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DPD-")) return clean;
  return `DPD-${clean.replaceAll(" ", "-")}`;
}
