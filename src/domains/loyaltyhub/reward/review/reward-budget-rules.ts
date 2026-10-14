import { RewardBudget } from "./reward-budget.js";

/** A rule a reward budget must pass. Check returns its problems, or none. */
export interface RewardBudgetRule {
  check(item: RewardBudget): string[];
}

export class RewardBudgetCodeLengthRule implements RewardBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardBudget): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardBudgetCodePrefixRule implements RewardBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RewardBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RewardBudgetRequiredTitleRule implements RewardBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RewardBudgetRequiredCodeRule implements RewardBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RewardBudgetEndsAtRangeRule implements RewardBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardBudget): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a reward budget. */
export class RewardBudgetValidator {
  rules: RewardBudgetRule[];

  constructor(rules: RewardBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: RewardBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardBudget[]): Map<string, string[]> {
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

export function defaultRewardBudgetValidator(): RewardBudgetValidator {
  return new RewardBudgetValidator(
    [
      new RewardBudgetCodeLengthRule(32),
      new RewardBudgetCodePrefixRule("ACM"),
      new RewardBudgetRequiredTitleRule("reward budget needs a value"),
      new RewardBudgetRequiredCodeRule("reward budget needs a value"),
      new RewardBudgetEndsAtRangeRule(80, 86400),
    ],
  );
}
