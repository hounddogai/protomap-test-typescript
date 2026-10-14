import { ManualLevelBudget } from "./manual-level-budget.js";

/** A rule a manual level budget must pass. Check returns its problems, or none. */
export interface ManualLevelBudgetRule {
  check(item: ManualLevelBudget): string[];
}

export class ManualLevelBudgetTitleLengthRule implements ManualLevelBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualLevelBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualLevelBudgetCreatedAtRangeRule implements ManualLevelBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualLevelBudget): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualLevelBudgetRequiredRegionRule implements ManualLevelBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualLevelBudget): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual level budget. */
export class ManualLevelBudgetValidator {
  rules: ManualLevelBudgetRule[];

  constructor(rules: ManualLevelBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: ManualLevelBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualLevelBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualLevelBudget[]): Map<string, string[]> {
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

export function defaultManualLevelBudgetValidator(): ManualLevelBudgetValidator {
  return new ManualLevelBudgetValidator(
    [
      new ManualLevelBudgetTitleLengthRule(80),
      new ManualLevelBudgetCreatedAtRangeRule(64, 86400),
      new ManualLevelBudgetRequiredRegionRule("manual level budget needs a value"),
    ],
  );
}
