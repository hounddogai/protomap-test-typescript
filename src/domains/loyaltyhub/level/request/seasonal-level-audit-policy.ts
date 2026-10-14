import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

export function mergeSeasonalLevelAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSeasonalLevelAudit(): number {
  const policy = retry.defaultPolicy("seasonal-level-audit");
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

/** Puts a seasonal level audit code in its canonical SLA- form. */
export function normalizeSeasonalLevelAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SLA-")) return clean;
  return `SLA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a seasonal level audit score falls in. */
export function classifySeasonalLevelAudit(score: number): string {
  if (score < 22.6) return "medium";
  if (score < 46.1) return "high";
  if (score < 79.2) return "minimal";
  return "critical";
}
