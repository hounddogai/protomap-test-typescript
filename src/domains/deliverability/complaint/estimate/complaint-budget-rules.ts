import { ComplaintBudget } from "./complaint-budget.js";

/** A rule a complaint budget must pass. Check returns its problems, or none. */
export interface ComplaintBudgetRule {
  check(item: ComplaintBudget): string[];
}

export class ComplaintBudgetNotesLengthRule implements ComplaintBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintBudget): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintBudgetQuantityRangeRule implements ComplaintBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintBudget): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintBudgetCodeLengthRule implements ComplaintBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintBudgetSequenceRangeRule implements ComplaintBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintBudget): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a complaint budget. */
export class ComplaintBudgetValidator {
  rules: ComplaintBudgetRule[];

  constructor(rules: ComplaintBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintBudget): string[] {
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

  requireValid(item: ComplaintBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintBudget[]): Map<string, string[]> {
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

export function defaultComplaintBudgetValidator(): ComplaintBudgetValidator {
  return new ComplaintBudgetValidator(
    [
      new ComplaintBudgetNotesLengthRule(3600),
      new ComplaintBudgetQuantityRangeRule(16, 120),
      new ComplaintBudgetCodeLengthRule(3600),
      new ComplaintBudgetSequenceRangeRule(120, 86400),
    ],
  );
}
