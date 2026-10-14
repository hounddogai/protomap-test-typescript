import { StreakBudget } from "./streak-budget.js";

/** A rule a streak budget must pass. Check returns its problems, or none. */
export interface StreakBudgetRule {
  check(item: StreakBudget): string[];
}

export class StreakBudgetNameLengthRule implements StreakBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakBudget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakBudgetRequiredSegmentRule implements StreakBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakBudget): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class StreakBudgetCodePrefixRule implements StreakBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StreakBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StreakBudgetRequiredCodeRule implements StreakBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a streak budget. */
export class StreakBudgetValidator {
  rules: StreakBudgetRule[];

  constructor(rules: StreakBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: StreakBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StreakBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakBudget[]): Map<string, string[]> {
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

export function defaultStreakBudgetValidator(): StreakBudgetValidator {
  return new StreakBudgetValidator(
    [
      new StreakBudgetNameLengthRule(32),
      new StreakBudgetRequiredSegmentRule("streak budget needs an entry"),
      new StreakBudgetCodePrefixRule("ACM"),
      new StreakBudgetRequiredCodeRule("streak budget needs a value"),
    ],
  );
}
