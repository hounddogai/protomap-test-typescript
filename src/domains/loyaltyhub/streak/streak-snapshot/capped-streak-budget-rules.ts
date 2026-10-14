import { CappedStreakBudget } from "./capped-streak-budget.js";

/** A rule a capped streak budget must pass. Check returns its problems, or none. */
export interface CappedStreakBudgetRule {
  check(item: CappedStreakBudget): string[];
}

export class CappedStreakBudgetRequiredSummaryRule implements CappedStreakBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedStreakBudget): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class CappedStreakBudgetRequiredTitleRule implements CappedStreakBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedStreakBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class CappedStreakBudgetVariantLengthRule implements CappedStreakBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStreakBudget): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedStreakBudgetCodeLengthRule implements CappedStreakBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedStreakBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped streak budget. */
export class CappedStreakBudgetValidator {
  rules: CappedStreakBudgetRule[];

  constructor(rules: CappedStreakBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: CappedStreakBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedStreakBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedStreakBudget[]): Map<string, string[]> {
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

export function defaultCappedStreakBudgetValidator(): CappedStreakBudgetValidator {
  return new CappedStreakBudgetValidator(
    [
      new CappedStreakBudgetRequiredSummaryRule("capped streak budget needs a value"),
      new CappedStreakBudgetRequiredTitleRule("capped streak budget needs this field"),
      new CappedStreakBudgetVariantLengthRule(255),
      new CappedStreakBudgetCodeLengthRule(3600),
    ],
  );
}
