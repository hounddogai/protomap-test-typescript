import { CohortBudget } from "./cohort-budget.js";

/** A rule a cohort budget must pass. Check returns its problems, or none. */
export interface CohortBudgetRule {
  check(item: CohortBudget): string[];
}

export class CohortBudgetTitleLengthRule implements CohortBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortBudgetRequiredSourceRule implements CohortBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortBudget): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class CohortBudgetSourceLengthRule implements CohortBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CohortBudget): string[] {
    const size = item.source.length;
    if (size > this.maxLength) return [`source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CohortBudgetSequenceRangeRule implements CohortBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CohortBudget): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CohortBudgetRequiredTitleRule implements CohortBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CohortBudgetRequiredCodeRule implements CohortBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CohortBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a cohort budget. */
export class CohortBudgetValidator {
  rules: CohortBudgetRule[];

  constructor(rules: CohortBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: CohortBudget): string[] {
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

  requireValid(item: CohortBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CohortBudget[]): Map<string, string[]> {
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

export function defaultCohortBudgetValidator(): CohortBudgetValidator {
  return new CohortBudgetValidator(
    [
      new CohortBudgetTitleLengthRule(16),
      new CohortBudgetRequiredSourceRule("cohort budget needs this field"),
      new CohortBudgetSourceLengthRule(32),
      new CohortBudgetSequenceRangeRule(64, 120),
      new CohortBudgetRequiredTitleRule("cohort budget needs an entry"),
      new CohortBudgetRequiredCodeRule("cohort budget needs a value"),
    ],
  );
}
