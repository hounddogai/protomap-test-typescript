import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalDomainThreshold(): number {
  const policy = retry.defaultPolicy("global-domain-threshold");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function mergeGlobalDomainThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a global domain threshold score falls in. */
export function classifyGlobalDomainThreshold(score: number): string {
  if (score < 17.9) return "ok";
  if (score < 98) return "watch";
  return "elevated";
}

/** Puts a global domain threshold code in its canonical GDT- form. */
export function normalizeGlobalDomainThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GDT-")) return clean;
  return `GDT-${clean.replaceAll(" ", "-")}`;
}
