import { RollingExitRuleReview } from "./rolling-exit-rule-review.js";

/** A rule a rolling exit rule review must pass. Check returns its problems, or none. */
export interface RollingExitRuleReviewRule {
  check(item: RollingExitRuleReview): string[];
}

export class RollingExitRuleReviewSendAtRangeRule implements RollingExitRuleReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingExitRuleReview): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingExitRuleReviewCodeLengthRule implements RollingExitRuleReviewRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingExitRuleReview): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingExitRuleReviewAmountRangeRule implements RollingExitRuleReviewRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingExitRuleReview): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a rolling exit rule review. */
export class RollingExitRuleReviewValidator {
  rules: RollingExitRuleReviewRule[];

  constructor(rules: RollingExitRuleReviewRule[]) {
    this.rules = rules;
  }

  validate(item: RollingExitRuleReview): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingExitRuleReview): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingExitRuleReview[]): Map<string, string[]> {
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

export function defaultRollingExitRuleReviewValidator(): RollingExitRuleReviewValidator {
  return new RollingExitRuleReviewValidator(
    [
      new RollingExitRuleReviewSendAtRangeRule(16, 86400),
      new RollingExitRuleReviewCodeLengthRule(80),
      new RollingExitRuleReviewAmountRangeRule(4.7, 3948.9),
    ],
  );
}
