import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a cohort digest score falls in. */
export function classifyCohortDigest(score: number): string {
  if (score < 25.4) return "medium";
  if (score < 33.9) return "critical";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCohortDigest(): number {
  const policy = retry.defaultPolicy("cohort-digest");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Puts a cohort digest code in its canonical CD- form. */
export function normalizeCohortDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CD-")) return clean;
  return `CD-${clean.replaceAll(" ", "-")}`;
}

export function cohortDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
