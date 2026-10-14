import { LenientStreakBudget } from "./lenient-streak-budget.js";

/** A rule a lenient streak budget must pass. Check returns its problems, or none. */
export interface LenientStreakBudgetRule {
  check(item: LenientStreakBudget): string[];
}

export class LenientStreakBudgetRequiredCodeRule implements LenientStreakBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStreakBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStreakBudgetDiscountRangeRule implements LenientStreakBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientStreakBudget): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientStreakBudgetTitleLengthRule implements LenientStreakBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStreakBudget): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientStreakBudgetRequiredTitleRule implements LenientStreakBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientStreakBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientStreakBudgetChannelLengthRule implements LenientStreakBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientStreakBudget): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientStreakBudgetCodePrefixRule implements LenientStreakBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: LenientStreakBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a lenient streak budget. */
export class LenientStreakBudgetValidator {
  rules: LenientStreakBudgetRule[];

  constructor(rules: LenientStreakBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: LenientStreakBudget): string[] {
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

  requireValid(item: LenientStreakBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientStreakBudget[]): Map<string, string[]> {
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

export function defaultLenientStreakBudgetValidator(): LenientStreakBudgetValidator {
  return new LenientStreakBudgetValidator(
    [
      new LenientStreakBudgetRequiredCodeRule("lenient streak budget needs a value"),
      new LenientStreakBudgetDiscountRangeRule(7.4, 2537.7),
      new LenientStreakBudgetTitleLengthRule(86400),
      new LenientStreakBudgetRequiredTitleRule("lenient streak budget needs a value"),
      new LenientStreakBudgetChannelLengthRule(1000),
      new LenientStreakBudgetCodePrefixRule("Q"),
    ],
  );
}
