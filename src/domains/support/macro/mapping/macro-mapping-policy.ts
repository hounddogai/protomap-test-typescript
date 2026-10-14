import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeMacroMapping(): number {
  const policy = retry.defaultPolicy("macro-mapping");
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

/** Puts a macro mapping code in its canonical MM- form. */
export function normalizeMacroMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MM-")) return clean;
  return `MM-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 11339.0, in order. */
export function macroMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11339) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
