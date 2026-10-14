import { DeflectionBudget } from "./deflection-budget.js";

/** A rule a deflection budget must pass. Check returns its problems, or none. */
export interface DeflectionBudgetRule {
  check(item: DeflectionBudget): string[];
}

export class DeflectionBudgetRequiredLabelRule implements DeflectionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionBudget): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionBudgetRequiredLocaleRule implements DeflectionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DeflectionBudget): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class DeflectionBudgetWeightRangeRule implements DeflectionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionBudget): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DeflectionBudgetLabelLengthRule implements DeflectionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionBudget): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class DeflectionBudgetMinimumRangeRule implements DeflectionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DeflectionBudget): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DeflectionBudgetCodeLengthRule implements DeflectionBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DeflectionBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a deflection budget. */
export class DeflectionBudgetValidator {
  rules: DeflectionBudgetRule[];

  constructor(rules: DeflectionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: DeflectionBudget): string[] {
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

  requireValid(item: DeflectionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DeflectionBudget[]): Map<string, string[]> {
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

export function defaultDeflectionBudgetValidator(): DeflectionBudgetValidator {
  return new DeflectionBudgetValidator(
    [
      new DeflectionBudgetRequiredLabelRule("deflection budget needs this field"),
      new DeflectionBudgetRequiredLocaleRule("deflection budget needs an entry"),
      new DeflectionBudgetWeightRangeRule(1.3, 4535.4),
      new DeflectionBudgetLabelLengthRule(16),
      new DeflectionBudgetMinimumRangeRule(3.8, 52.2),
      new DeflectionBudgetCodeLengthRule(16),
    ],
  );
}
