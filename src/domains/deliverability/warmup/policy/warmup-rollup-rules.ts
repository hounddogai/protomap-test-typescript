import * as text from "../../../../kit/text.js";
import { WarmupRollup } from "./warmup-rollup.js";

/** A rule a warmup rollup must pass. Check returns its problems, or none. */
export interface WarmupRollupRule {
  check(item: WarmupRollup): string[];
}

export class WarmupRollupRequiredCodeRule implements WarmupRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupRollupRequiredNameRule implements WarmupRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WarmupRollup): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class WarmupRollupAllowedCohortRule implements WarmupRollupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WarmupRollup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.cohort))) return [`cohort ${item.cohort} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a warmup rollup. */
export class WarmupRollupValidator {
  rules: WarmupRollupRule[];

  constructor(rules: WarmupRollupRule[]) {
    this.rules = rules;
  }

  validate(item: WarmupRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WarmupRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WarmupRollup[]): Map<string, string[]> {
    const report = new Map<string, string[]>();
    for (const item of items) {
      const problems = this.validate(item);
      if (problems.length > 0) {
        report.set(item.code, problems);
      }
    }
    return report;
  }
}

export function defaultWarmupRollupValidator(): WarmupRollupValidator {
  return new WarmupRollupValidator(
    [
      new WarmupRollupRequiredCodeRule("warmup rollup needs an entry"),
      new WarmupRollupRequiredNameRule("warmup rollup needs an entry"),
      new WarmupRollupAllowedCohortRule(["scheduled", "regional", "capped"]),
    ],
  );
}
