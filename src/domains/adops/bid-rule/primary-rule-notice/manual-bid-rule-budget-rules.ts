import { ManualBidRuleBudget } from "./manual-bid-rule-budget.js";

/** A rule a manual bid rule budget must pass. Check returns its problems, or none. */
export interface ManualBidRuleBudgetRule {
  check(item: ManualBidRuleBudget): string[];
}

export class ManualBidRuleBudgetRequiredTitleRule implements ManualBidRuleBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBidRuleBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBidRuleBudgetStartsAtRangeRule implements ManualBidRuleBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBidRuleBudget): string[] {
    const value = item.startsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`starts at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`starts at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualBidRuleBudgetRequiredChannelRule implements ManualBidRuleBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualBidRuleBudget): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ManualBidRuleBudgetCodePrefixRule implements ManualBidRuleBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualBidRuleBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualBidRuleBudgetRetriesRangeRule implements ManualBidRuleBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualBidRuleBudget): string[] {
    const value = item.retries;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`retries ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`retries ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualBidRuleBudgetChannelLengthRule implements ManualBidRuleBudgetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualBidRuleBudget): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual bid rule budget. */
export class ManualBidRuleBudgetValidator {
  rules: ManualBidRuleBudgetRule[];

  constructor(rules: ManualBidRuleBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: ManualBidRuleBudget): string[] {
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

  requireValid(item: ManualBidRuleBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualBidRuleBudget[]): Map<string, string[]> {
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

export function defaultManualBidRuleBudgetValidator(): ManualBidRuleBudgetValidator {
  return new ManualBidRuleBudgetValidator(
    [
      new ManualBidRuleBudgetRequiredTitleRule("manual bid rule budget needs a value"),
      new ManualBidRuleBudgetStartsAtRangeRule(64, 86400),
      new ManualBidRuleBudgetRequiredChannelRule("manual bid rule budget needs this field"),
      new ManualBidRuleBudgetCodePrefixRule("ACM"),
      new ManualBidRuleBudgetRetriesRangeRule(16, 32),
      new ManualBidRuleBudgetChannelLengthRule(16),
    ],
  );
}
