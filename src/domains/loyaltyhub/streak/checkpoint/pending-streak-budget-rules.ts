import * as text from "../../../../kit/text.js";
import { PendingStreakBudget } from "./pending-streak-budget.js";

/** A rule a pending streak budget must pass. Check returns its problems, or none. */
export interface PendingStreakBudgetRule {
  check(item: PendingStreakBudget): string[];
}

export class PendingStreakBudgetCodeLengthRule implements PendingStreakBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingStreakBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingStreakBudgetCountryLengthRule implements PendingStreakBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingStreakBudget): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingStreakBudgetAllowedCountryRule implements PendingStreakBudgetRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingStreakBudget): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is below minimum`];
    return [];
  }
}

export class PendingStreakBudgetTimezoneLengthRule implements PendingStreakBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingStreakBudget): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingStreakBudgetRequiredTitleRule implements PendingStreakBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingStreakBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class PendingStreakBudgetCodePrefixRule implements PendingStreakBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PendingStreakBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a pending streak budget. */
export class PendingStreakBudgetValidator {
  rules: PendingStreakBudgetRule[];

  constructor(rules: PendingStreakBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PendingStreakBudget): string[] {
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

  requireValid(item: PendingStreakBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingStreakBudget[]): Map<string, string[]> {
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

export function defaultPendingStreakBudgetValidator(): PendingStreakBudgetValidator {
  return new PendingStreakBudgetValidator(
    [
      new PendingStreakBudgetCodeLengthRule(120),
      new PendingStreakBudgetCountryLengthRule(86400),
      new PendingStreakBudgetAllowedCountryRule(["primary"]),
      new PendingStreakBudgetTimezoneLengthRule(1000),
      new PendingStreakBudgetRequiredTitleRule("pending streak budget needs a value"),
      new PendingStreakBudgetCodePrefixRule("OPS"),
    ],
  );
}
