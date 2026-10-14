import { SubscriptionBudget } from "./subscription-budget.js";

/** A rule a subscription budget must pass. Check returns its problems, or none. */
export interface SubscriptionBudgetRule {
  check(item: SubscriptionBudget): string[];
}

export class SubscriptionBudgetCodePrefixRule implements SubscriptionBudgetRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionBudget): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionBudgetAmountRangeRule implements SubscriptionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionBudget): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionBudgetRequiredCodeRule implements SubscriptionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionBudget): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionBudgetVersionRangeRule implements SubscriptionBudgetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionBudget): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionBudgetRequiredAudienceIdRule implements SubscriptionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionBudget): string[] {
    if (item.audienceId.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionBudgetRequiredTitleRule implements SubscriptionBudgetRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionBudget): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a subscription budget. */
export class SubscriptionBudgetValidator {
  rules: SubscriptionBudgetRule[];

  constructor(rules: SubscriptionBudgetRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionBudget): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionBudget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionBudget[]): Map<string, string[]> {
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

export function defaultSubscriptionBudgetValidator(): SubscriptionBudgetValidator {
  return new SubscriptionBudgetValidator(
    [
      new SubscriptionBudgetCodePrefixRule("Q"),
      new SubscriptionBudgetAmountRangeRule(6.4, 4991.2),
      new SubscriptionBudgetRequiredCodeRule("subscription budget needs a value"),
      new SubscriptionBudgetVersionRangeRule(255, 3600),
      new SubscriptionBudgetRequiredAudienceIdRule("subscription budget needs this field"),
      new SubscriptionBudgetRequiredTitleRule("subscription budget needs an entry"),
    ],
  );
}
