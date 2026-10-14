import { DoubleOptInBudget } from "./double-opt-in-budget.js";

/** A rule a double opt in budget must pass. Check returns its problems, or none. */
export interface DoubleOptInBudgetRule {
  check(item: DoubleOptInBudget): string[];
}

export class DoubleOptInBudgetActiveGuardRule implements DoubleOptInBudgetRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DoubleOptInBudget): string[] {
    if (item.active && item.amount > this.limit) return [`amount ${item.amount} exceeds ${this.limit} while active`];
    return [];
  }
}

export class DoubleOptInBudgetRequiredCodeRule implements DoubleOptInBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DoubleOptInBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class DoubleOptInBudgetTitleLengthRule implements DoubleOptInBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DoubleOptInBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DoubleOptInBudgetWindowDaysRangeRule implements DoubleOptInBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInBudget): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a double opt in budget. */
export class DoubleOptInBudgetValidator {
  rules: DoubleOptInBudgetRule[];

  constructor(rules: DoubleOptInBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInBudget[]): Map<string, string[]> {
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

export function defaultDoubleOptInBudgetValidator(): DoubleOptInBudgetValidator {
  return new DoubleOptInBudgetValidator(
    [
      new DoubleOptInBudgetActiveGuardRule(9.1),
      new DoubleOptInBudgetRequiredCodeRule("double opt in budget needs an entry"),
      new DoubleOptInBudgetTitleLengthRule(80),
      new DoubleOptInBudgetWindowDaysRangeRule(16, 255),
    ],
  );
}
