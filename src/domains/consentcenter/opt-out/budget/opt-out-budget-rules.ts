import { OptOutBudget } from "./opt-out-budget.js";

/** A rule a opt out budget must pass. Check returns its problems, or none. */
export interface OptOutBudgetRule {
  check(item: OptOutBudget): string[];
}

export class OptOutBudgetCapacityRangeRule implements OptOutBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: OptOutBudget): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class OptOutBudgetRequiredUnitRule implements OptOutBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutBudget): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class OptOutBudgetRequiredCodeRule implements OptOutBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: OptOutBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a opt out budget. */
export class OptOutBudgetValidator {
  rules: OptOutBudgetRule[];

  constructor(rules: OptOutBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: OptOutBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: OptOutBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: OptOutBudget[]): Map<string, string[]> {
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

export function defaultOptOutBudgetValidator(): OptOutBudgetValidator {
  return new OptOutBudgetValidator(
    [
      new OptOutBudgetCapacityRangeRule(1000, 86400),
      new OptOutBudgetRequiredUnitRule("opt out budget needs a value"),
      new OptOutBudgetRequiredCodeRule("opt out budget needs this field"),
    ],
  );
}
