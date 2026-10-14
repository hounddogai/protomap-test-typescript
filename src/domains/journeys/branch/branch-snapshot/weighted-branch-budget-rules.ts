import { WeightedBranchBudget } from "./weighted-branch-budget.js";

/** A rule a weighted branch budget must pass. Check returns its problems, or none. */
export interface WeightedBranchBudgetRule {
  check(item: WeightedBranchBudget): string[];
}

export class WeightedBranchBudgetRequiredPhoneRule implements WeightedBranchBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBranchBudget): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBranchBudgetRequiredCodeRule implements WeightedBranchBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WeightedBranchBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WeightedBranchBudgetTitleLengthRule implements WeightedBranchBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedBranchBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedBranchBudgetCodePrefixRule implements WeightedBranchBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WeightedBranchBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WeightedBranchBudgetDiscountRangeRule implements WeightedBranchBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: WeightedBranchBudget): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a weighted branch budget. */
export class WeightedBranchBudgetValidator {
  rules: WeightedBranchBudgetRule[];

  constructor(rules: WeightedBranchBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedBranchBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WeightedBranchBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedBranchBudget[]): Map<string, string[]> {
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

export function defaultWeightedBranchBudgetValidator(): WeightedBranchBudgetValidator {
  return new WeightedBranchBudgetValidator(
    [
      new WeightedBranchBudgetRequiredPhoneRule("weighted branch budget needs this field"),
      new WeightedBranchBudgetRequiredCodeRule("weighted branch budget needs an entry"),
      new WeightedBranchBudgetTitleLengthRule(32),
      new WeightedBranchBudgetCodePrefixRule("REF"),
      new WeightedBranchBudgetDiscountRangeRule(1.2, 1620.4),
    ],
  );
}
