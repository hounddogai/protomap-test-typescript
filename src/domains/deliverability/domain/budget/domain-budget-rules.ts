import { DomainBudget } from "./domain-budget.js";

/** A rule a domain budget must pass. Check returns its problems, or none. */
export interface DomainBudgetRule {
  check(item: DomainBudget): string[];
}

export class DomainBudgetWindowDaysRangeRule implements DomainBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainBudget): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainBudgetUpdatedAtRangeRule implements DomainBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainBudget): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainBudgetRequiredCodeRule implements DomainBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a domain budget. */
export class DomainBudgetValidator {
  rules: DomainBudgetRule[];

  constructor(rules: DomainBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: DomainBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DomainBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainBudget[]): Map<string, string[]> {
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

export function defaultDomainBudgetValidator(): DomainBudgetValidator {
  return new DomainBudgetValidator(
    [
      new DomainBudgetWindowDaysRangeRule(64, 255),
      new DomainBudgetUpdatedAtRangeRule(32, 3600),
      new DomainBudgetRequiredCodeRule("domain budget needs this field"),
    ],
  );
}
