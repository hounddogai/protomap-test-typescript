import { PendingCohortBudget } from "./pending-cohort-budget.js";

/** A rule a pending cohort budget must pass. Check returns its problems, or none. */
export interface PendingCohortBudgetRule {
  check(item: PendingCohortBudget): string[];
}

export class PendingCohortBudgetRequiredRegionRule implements PendingCohortBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCohortBudget): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCohortBudgetRequiredNameRule implements PendingCohortBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingCohortBudget): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingCohortBudgetQuantityRangeRule implements PendingCohortBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCohortBudget): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingCohortBudgetCodeLengthRule implements PendingCohortBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCohortBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending cohort budget. */
export class PendingCohortBudgetValidator {
  rules: PendingCohortBudgetRule[];

  constructor(rules: PendingCohortBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCohortBudget): string[] {
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

  requireValid(item: PendingCohortBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCohortBudget[]): Map<string, string[]> {
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

export function defaultPendingCohortBudgetValidator(): PendingCohortBudgetValidator {
  return new PendingCohortBudgetValidator(
    [
      new PendingCohortBudgetRequiredRegionRule("pending cohort budget needs an entry"),
      new PendingCohortBudgetRequiredNameRule("pending cohort budget needs an entry"),
      new PendingCohortBudgetQuantityRangeRule(16, 86400),
      new PendingCohortBudgetCodeLengthRule(255),
    ],
  );
}
