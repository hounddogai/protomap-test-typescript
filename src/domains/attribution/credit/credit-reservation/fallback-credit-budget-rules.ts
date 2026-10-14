import * as text from "../../../../kit/text.js";
import { FallbackCreditBudget } from "./fallback-credit-budget.js";

/** A rule a fallback credit budget must pass. Check returns its problems, or none. */
export interface FallbackCreditBudgetRule {
  check(item: FallbackCreditBudget): string[];
}

export class FallbackCreditBudgetRequiredReviewerRule implements FallbackCreditBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditBudget): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCreditBudgetRequiredCodeRule implements FallbackCreditBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackCreditBudgetGraceDaysRangeRule implements FallbackCreditBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCreditBudget): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackCreditBudgetRatioRangeRule implements FallbackCreditBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackCreditBudget): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackCreditBudgetAllowedLabelRule implements FallbackCreditBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackCreditBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

export class FallbackCreditBudgetRequiredPhoneRule implements FallbackCreditBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackCreditBudget): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback credit budget. */
export class FallbackCreditBudgetValidator {
  rules: FallbackCreditBudgetRule[];

  constructor(rules: FallbackCreditBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackCreditBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackCreditBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackCreditBudget[]): Map<string, string[]> {
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

export function defaultFallbackCreditBudgetValidator(): FallbackCreditBudgetValidator {
  return new FallbackCreditBudgetValidator(
    [
      new FallbackCreditBudgetRequiredReviewerRule("fallback credit budget needs a value"),
      new FallbackCreditBudgetRequiredCodeRule("fallback credit budget needs a value"),
      new FallbackCreditBudgetGraceDaysRangeRule(80, 255),
      new FallbackCreditBudgetRatioRangeRule(3, 1293.1),
      new FallbackCreditBudgetAllowedLabelRule(["strict"]),
      new FallbackCreditBudgetRequiredPhoneRule("fallback credit budget needs a value"),
    ],
  );
}
