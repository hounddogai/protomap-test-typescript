import * as retry from "../../../../kit/retry.js";

/** Puts a legacy touchpoint template code in its canonical LTT- form. */
export function normalizeLegacyTouchpointTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LTT-")) return clean;
  return `LTT-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyTouchpointTemplate(): number {
  const policy = retry.defaultPolicy("legacy-touchpoint-template");
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

/** Counts how many amounts fit in a budget of 59587.0, in order. */
export function legacyTouchpointTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59587) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
