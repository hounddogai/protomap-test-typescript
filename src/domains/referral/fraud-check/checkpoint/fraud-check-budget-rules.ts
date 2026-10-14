import { FraudCheckBudget } from "./fraud-check-budget.js";

/** A rule a fraud check budget must pass. Check returns its problems, or none. */
export interface FraudCheckBudgetRule {
  check(item: FraudCheckBudget): string[];
}

export class FraudCheckBudgetAttemptsRangeRule implements FraudCheckBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckBudget): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FraudCheckBudgetNotesLengthRule implements FraudCheckBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckBudget): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckBudgetRequiredNotesRule implements FraudCheckBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckBudget): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckBudgetRequiredJourneyIdRule implements FraudCheckBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckBudget): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fraud check budget. */
export class FraudCheckBudgetValidator {
  rules: FraudCheckBudgetRule[];

  constructor(rules: FraudCheckBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckBudget[]): Map<string, string[]> {
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

export function defaultFraudCheckBudgetValidator(): FraudCheckBudgetValidator {
  return new FraudCheckBudgetValidator(
    [
      new FraudCheckBudgetAttemptsRangeRule(120, 1000),
      new FraudCheckBudgetNotesLengthRule(86400),
      new FraudCheckBudgetRequiredNotesRule("fraud check budget needs this field"),
      new FraudCheckBudgetRequiredJourneyIdRule("fraud check budget needs an entry"),
    ],
  );
}
