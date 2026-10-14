import { SubscriptionGroup } from "./subscription-group.js";

/** A rule a subscription group must pass. Check returns its problems, or none. */
export interface SubscriptionGroupRule {
  check(item: SubscriptionGroup): string[];
}

export class SubscriptionGroupRequiredCodeRule implements SubscriptionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionGroupGraceDaysRangeRule implements SubscriptionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionGroup): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionGroupContactEmailLengthRule implements SubscriptionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionGroup): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a subscription group. */
export class SubscriptionGroupValidator {
  rules: SubscriptionGroupRule[];

  constructor(rules: SubscriptionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionGroup[]): Map<string, string[]> {
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

export function defaultSubscriptionGroupValidator(): SubscriptionGroupValidator {
  return new SubscriptionGroupValidator(
    [
      new SubscriptionGroupRequiredCodeRule("subscription group needs this field"),
      new SubscriptionGroupGraceDaysRangeRule(16, 1000),
      new SubscriptionGroupContactEmailLengthRule(120),
    ],
  );
}
