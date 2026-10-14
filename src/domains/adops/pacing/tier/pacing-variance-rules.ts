import { PacingVariance } from "./pacing-variance.js";

/** A rule a pacing variance must pass. Check returns its problems, or none. */
export interface PacingVarianceRule {
  check(item: PacingVariance): string[];
}

export class PacingVarianceArchivedGuardRule implements PacingVarianceRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PacingVariance): string[] {
    if (item.archived && item.retries > this.limit) return [`retries ${item.retries} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PacingVarianceRequiredSummaryRule implements PacingVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingVariance): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class PacingVarianceRequiredCodeRule implements PacingVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing variance. */
export class PacingVarianceValidator {
  rules: PacingVarianceRule[];

  constructor(rules: PacingVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PacingVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      const found = rule.check(item);
      if (found.length === 0) continue;
      for (const problem of found) {
        problems.push(`${item.code}: ${problem}`);
      }
    }
    return problems;
  }

  requireValid(item: PacingVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingVariance[]): Map<string, string[]> {
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

export function defaultPacingVarianceValidator(): PacingVarianceValidator {
  return new PacingVarianceValidator(
    [
      new PacingVarianceArchivedGuardRule(120),
      new PacingVarianceRequiredSummaryRule("pacing variance needs a value"),
      new PacingVarianceRequiredCodeRule("pacing variance needs a value"),
    ],
  );
}
