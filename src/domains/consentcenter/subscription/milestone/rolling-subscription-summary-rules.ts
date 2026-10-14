import { RollingSubscriptionSummary } from "./rolling-subscription-summary.js";

/** A rule a rolling subscription summary must pass. Check returns its problems, or none. */
export interface RollingSubscriptionSummaryRule {
  check(item: RollingSubscriptionSummary): string[];
}

export class RollingSubscriptionSummaryClicksRangeRule implements RollingSubscriptionSummaryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingSubscriptionSummary): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RollingSubscriptionSummaryRequiredCodeRule implements RollingSubscriptionSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingSubscriptionSummary): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RollingSubscriptionSummaryCohortLengthRule implements RollingSubscriptionSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingSubscriptionSummary): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling subscription summary. */
export class RollingSubscriptionSummaryValidator {
  rules: RollingSubscriptionSummaryRule[];

  constructor(rules: RollingSubscriptionSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: RollingSubscriptionSummary): string[] {
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

  requireValid(item: RollingSubscriptionSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingSubscriptionSummary[]): Map<string, string[]> {
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

export function defaultRollingSubscriptionSummaryValidator(): RollingSubscriptionSummaryValidator {
  return new RollingSubscriptionSummaryValidator(
    [
      new RollingSubscriptionSummaryClicksRangeRule(80, 1000),
      new RollingSubscriptionSummaryRequiredCodeRule("rolling subscription summary needs an entry"),
      new RollingSubscriptionSummaryCohortLengthRule(120),
    ],
  );
}
