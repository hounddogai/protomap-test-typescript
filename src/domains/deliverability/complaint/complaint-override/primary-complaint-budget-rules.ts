import { PrimaryComplaintBudget } from "./primary-complaint-budget.js";

/** A rule a primary complaint budget must pass. Check returns its problems, or none. */
export interface PrimaryComplaintBudgetRule {
  check(item: PrimaryComplaintBudget): string[];
}

export class PrimaryComplaintBudgetExpiresAtRangeRule implements PrimaryComplaintBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryComplaintBudget): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryComplaintBudgetOpenRateRangeRule implements PrimaryComplaintBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryComplaintBudget): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryComplaintBudgetCreatedAtRangeRule implements PrimaryComplaintBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryComplaintBudget): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a primary complaint budget. */
export class PrimaryComplaintBudgetValidator {
  rules: PrimaryComplaintBudgetRule[];

  constructor(rules: PrimaryComplaintBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryComplaintBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryComplaintBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryComplaintBudget[]): Map<string, string[]> {
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

export function defaultPrimaryComplaintBudgetValidator(): PrimaryComplaintBudgetValidator {
  return new PrimaryComplaintBudgetValidator(
    [
      new PrimaryComplaintBudgetExpiresAtRangeRule(16, 86400),
      new PrimaryComplaintBudgetOpenRateRangeRule(8.6, 3118.4),
      new PrimaryComplaintBudgetCreatedAtRangeRule(255, 1000),
    ],
  );
}
