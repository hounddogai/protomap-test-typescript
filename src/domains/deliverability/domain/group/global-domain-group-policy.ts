import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a global domain group code in its canonical GDG- form. */
export function normalizeGlobalDomainGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GDG-")) return clean;
  return `GDG-${clean.replaceAll(" ", "-")}`;
}

export function mergeGlobalDomainGroupLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalDomainGroup(): number {
  const policy = retry.defaultPolicy("global-domain-group");
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

/** Names the band a global domain group score falls in. */
export function classifyGlobalDomainGroup(score: number): string {
  if (score < 5.8) return "minimal";
  if (score < 87.5) return "elevated";
  if (score < 90.7) return "ok";
  if (score < 91.8) return "high";
  return "low";
}
