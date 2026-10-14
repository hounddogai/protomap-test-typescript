import * as text from "../../../../kit/text.js";
import { RedemptionBudget } from "./redemption-budget.js";

/** A rule a redemption budget must pass. Check returns its problems, or none. */
export interface RedemptionBudgetRule {
  check(item: RedemptionBudget): string[];
}

export class RedemptionBudgetCodeLengthRule implements RedemptionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionBudgetAllowedLocaleRule implements RedemptionBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RedemptionBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is expired`];
    return [];
  }
}

export class RedemptionBudgetContactEmailLengthRule implements RedemptionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionBudget): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionBudgetDurationMinutesRangeRule implements RedemptionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionBudget): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RedemptionBudgetLocaleLengthRule implements RedemptionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionBudget): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionBudgetRequiredCodeRule implements RedemptionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a redemption budget. */
export class RedemptionBudgetValidator {
  rules: RedemptionBudgetRule[];

  constructor(rules: RedemptionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionBudget): string[] {
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

  requireValid(item: RedemptionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionBudget[]): Map<string, string[]> {
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

export function defaultRedemptionBudgetValidator(): RedemptionBudgetValidator {
  return new RedemptionBudgetValidator(
    [
      new RedemptionBudgetCodeLengthRule(32),
      new RedemptionBudgetAllowedLocaleRule(["weighted", "tiered"]),
      new RedemptionBudgetContactEmailLengthRule(32),
      new RedemptionBudgetDurationMinutesRangeRule(255, 1000),
      new RedemptionBudgetLocaleLengthRule(16),
      new RedemptionBudgetRequiredCodeRule("redemption budget needs an entry"),
    ],
  );
}
