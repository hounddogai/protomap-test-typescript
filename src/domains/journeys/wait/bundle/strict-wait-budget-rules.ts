import { StrictWaitBudget } from "./strict-wait-budget.js";

/** A rule a strict wait budget must pass. Check returns its problems, or none. */
export interface StrictWaitBudgetRule {
  check(item: StrictWaitBudget): string[];
}

export class StrictWaitBudgetRequiredTitleRule implements StrictWaitBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWaitBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class StrictWaitBudgetCodeLengthRule implements StrictWaitBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictWaitBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictWaitBudgetBatchSizeRangeRule implements StrictWaitBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictWaitBudget): string[] {
    const value = item.batchSize;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`batch size ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`batch size ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StrictWaitBudgetRequiredCodeRule implements StrictWaitBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictWaitBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict wait budget. */
export class StrictWaitBudgetValidator {
  rules: StrictWaitBudgetRule[];

  constructor(rules: StrictWaitBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: StrictWaitBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictWaitBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictWaitBudget[]): Map<string, string[]> {
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

export function defaultStrictWaitBudgetValidator(): StrictWaitBudgetValidator {
  return new StrictWaitBudgetValidator(
    [
      new StrictWaitBudgetRequiredTitleRule("strict wait budget needs this field"),
      new StrictWaitBudgetCodeLengthRule(1000),
      new StrictWaitBudgetBatchSizeRangeRule(32, 3600),
      new StrictWaitBudgetRequiredCodeRule("strict wait budget needs an entry"),
    ],
  );
}
