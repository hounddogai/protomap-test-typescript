import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Puts a creative digest code in its canonical CD- form. */
export function normalizeCreativeDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CD-")) return clean;
  return `CD-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCreativeDigest(): number {
  const policy = retry.defaultPolicy("creative-digest");
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

export function creativeDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a creative digest score falls in. */
export function classifyCreativeDigest(score: number): string {
  if (score < 50.9) return "elevated";
  if (score < 54.8) return "high";
  if (score < 59.2) return "medium";
  return "watch";
}
