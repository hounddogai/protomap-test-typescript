import { CreditRollup } from "./credit-rollup.js";

/** A rule a credit rollup must pass. Check returns its problems, or none. */
export interface CreditRollupRule {
  check(item: CreditRollup): string[];
}

export class CreditRollupRequiredTitleRule implements CreditRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditRollup): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CreditRollupThresholdRangeRule implements CreditRollupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CreditRollup): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CreditRollupReviewerLengthRule implements CreditRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditRollup): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditRollupTitleLengthRule implements CreditRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditRollup): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a credit rollup. */
export class CreditRollupValidator {
  rules: CreditRollupRule[];

  constructor(rules: CreditRollupRule[]) {
    this.rules = rules;
  }

  validate(item: CreditRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CreditRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditRollup[]): Map<string, string[]> {
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

export function defaultCreditRollupValidator(): CreditRollupValidator {
  return new CreditRollupValidator(
    [
      new CreditRollupRequiredTitleRule("credit rollup needs this field"),
      new CreditRollupThresholdRangeRule(7.8, 3092.9),
      new CreditRollupReviewerLengthRule(1000),
      new CreditRollupTitleLengthRule(120),
    ],
  );
}
