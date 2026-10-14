import { LegacyComplaintVariance } from "./legacy-complaint-variance.js";

/** A rule a legacy complaint variance must pass. Check returns its problems, or none. */
export interface LegacyComplaintVarianceRule {
  check(item: LegacyComplaintVariance): string[];
}

export class LegacyComplaintVarianceRequiredCodeRule implements LegacyComplaintVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyComplaintVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyComplaintVarianceRequiredTitleRule implements LegacyComplaintVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyComplaintVariance): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyComplaintVarianceCreatedAtRangeRule implements LegacyComplaintVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyComplaintVariance): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy complaint variance. */
export class LegacyComplaintVarianceValidator {
  rules: LegacyComplaintVarianceRule[];

  constructor(rules: LegacyComplaintVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyComplaintVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyComplaintVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyComplaintVariance[]): Map<string, string[]> {
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

export function defaultLegacyComplaintVarianceValidator(): LegacyComplaintVarianceValidator {
  return new LegacyComplaintVarianceValidator(
    [
      new LegacyComplaintVarianceRequiredCodeRule("legacy complaint variance needs a value"),
      new LegacyComplaintVarianceRequiredTitleRule("legacy complaint variance needs an entry"),
      new LegacyComplaintVarianceCreatedAtRangeRule(32, 64),
    ],
  );
}
