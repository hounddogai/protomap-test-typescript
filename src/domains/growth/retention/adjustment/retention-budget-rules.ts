import { RetentionBudget } from "./retention-budget.js";

/** A rule a retention budget must pass. Check returns its problems, or none. */
export interface RetentionBudgetRule {
  check(item: RetentionBudget): string[];
}

export class RetentionBudgetRequiredTitleRule implements RetentionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionBudgetRequiredCodeRule implements RetentionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionBudgetReviewerLengthRule implements RetentionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionBudget): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RetentionBudgetMinimumRangeRule implements RetentionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionBudget): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RetentionBudgetRequiredReviewerRule implements RetentionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionBudget): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionBudgetCampaignRefLengthRule implements RetentionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RetentionBudget): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a retention budget. */
export class RetentionBudgetValidator {
  rules: RetentionBudgetRule[];

  constructor(rules: RetentionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionBudget): string[] {
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

  requireValid(item: RetentionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionBudget[]): Map<string, string[]> {
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

export function defaultRetentionBudgetValidator(): RetentionBudgetValidator {
  return new RetentionBudgetValidator(
    [
      new RetentionBudgetRequiredTitleRule("retention budget needs a value"),
      new RetentionBudgetRequiredCodeRule("retention budget needs this field"),
      new RetentionBudgetReviewerLengthRule(64),
      new RetentionBudgetMinimumRangeRule(4.6, 973),
      new RetentionBudgetRequiredReviewerRule("retention budget needs an entry"),
      new RetentionBudgetCampaignRefLengthRule(1000),
    ],
  );
}
