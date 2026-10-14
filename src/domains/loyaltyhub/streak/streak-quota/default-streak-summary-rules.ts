import { DefaultStreakSummary } from "./default-streak-summary.js";

/** A rule a default streak summary must pass. Check returns its problems, or none. */
export interface DefaultStreakSummaryRule {
  check(item: DefaultStreakSummary): string[];
}

export class DefaultStreakSummaryReviewerLengthRule implements DefaultStreakSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultStreakSummary): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DefaultStreakSummaryQuantityRangeRule implements DefaultStreakSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultStreakSummary): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DefaultStreakSummaryRequiredLocaleRule implements DefaultStreakSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DefaultStreakSummary): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DefaultStreakSummaryUpdatedAtRangeRule implements DefaultStreakSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultStreakSummary): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a default streak summary. */
export class DefaultStreakSummaryValidator {
  rules: DefaultStreakSummaryRule[];

  constructor(rules: DefaultStreakSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultStreakSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultStreakSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultStreakSummary[]): Map<string, string[]> {
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

export function defaultDefaultStreakSummaryValidator(): DefaultStreakSummaryValidator {
  return new DefaultStreakSummaryValidator(
    [
      new DefaultStreakSummaryReviewerLengthRule(255),
      new DefaultStreakSummaryQuantityRangeRule(64, 64),
      new DefaultStreakSummaryRequiredLocaleRule("default streak summary needs an entry"),
      new DefaultStreakSummaryUpdatedAtRangeRule(16, 16),
    ],
  );
}
