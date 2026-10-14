import { ExitRuleBudget } from "./exit-rule-budget.js";

/** A rule a exit rule budget must pass. Check returns its problems, or none. */
export interface ExitRuleBudgetRule {
  check(item: ExitRuleBudget): string[];
}

export class ExitRuleBudgetQuantityRangeRule implements ExitRuleBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleBudget): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleBudgetCohortLengthRule implements ExitRuleBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ExitRuleBudget): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ExitRuleBudgetSendAtRangeRule implements ExitRuleBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleBudget): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a exit rule budget. */
export class ExitRuleBudgetValidator {
  rules: ExitRuleBudgetRule[];

  constructor(rules: ExitRuleBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleBudget): string[] {
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

  requireValid(item: ExitRuleBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleBudget[]): Map<string, string[]> {
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

export function defaultExitRuleBudgetValidator(): ExitRuleBudgetValidator {
  return new ExitRuleBudgetValidator(
    [
      new ExitRuleBudgetQuantityRangeRule(120, 255),
      new ExitRuleBudgetCohortLengthRule(86400),
      new ExitRuleBudgetSendAtRangeRule(32, 64),
    ],
  );
}
