import { InsightVariance } from "./insight-variance.js";

/** A rule a insight variance must pass. Check returns its problems, or none. */
export interface InsightVarianceRule {
  check(item: InsightVariance): string[];
}

export class InsightVarianceRetriesRangeRule implements InsightVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: InsightVariance): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class InsightVarianceCodeLengthRule implements InsightVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InsightVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InsightVarianceRequiredCodeRule implements InsightVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: InsightVariance): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a insight variance. */
export class InsightVarianceValidator {
  rules: InsightVarianceRule[];

  constructor(rules: InsightVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: InsightVariance): string[] {
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

  requireValid(item: InsightVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InsightVariance[]): Map<string, string[]> {
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

export function defaultInsightVarianceValidator(): InsightVarianceValidator {
  return new InsightVarianceValidator(
    [
      new InsightVarianceRetriesRangeRule(255, 86400),
      new InsightVarianceCodeLengthRule(3600),
      new InsightVarianceRequiredCodeRule("insight variance needs an entry"),
    ],
  );
}
