import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Puts a capped sla audit code in its canonical CSA- form. */
export function normalizeCappedSlaAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CSA-")) return clean;
  return `CSA-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedSlaAudit(): number {
  const policy = retry.defaultPolicy("capped-sla-audit");
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

export function cappedSlaAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeCappedSlaAuditLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
