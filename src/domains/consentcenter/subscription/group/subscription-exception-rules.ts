import { SubscriptionException } from "./subscription-exception.js";

/** A rule a subscription exception must pass. Check returns its problems, or none. */
export interface SubscriptionExceptionRule {
  check(item: SubscriptionException): string[];
}

export class SubscriptionExceptionRequiredLabelRule implements SubscriptionExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionException): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionExceptionCodeLengthRule implements SubscriptionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionException): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionExceptionAmountRangeRule implements SubscriptionExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionException): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionExceptionLabelLengthRule implements SubscriptionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionException): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionExceptionReviewerLengthRule implements SubscriptionExceptionRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionException): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a subscription exception. */
export class SubscriptionExceptionValidator {
  rules: SubscriptionExceptionRule[];

  constructor(rules: SubscriptionExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionException): string[] {
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

  requireValid(item: SubscriptionException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionException[]): Map<string, string[]> {
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

export function defaultSubscriptionExceptionValidator(): SubscriptionExceptionValidator {
  return new SubscriptionExceptionValidator(
    [
      new SubscriptionExceptionRequiredLabelRule("subscription exception needs this field"),
      new SubscriptionExceptionCodeLengthRule(3600),
      new SubscriptionExceptionAmountRangeRule(2.6, 4881.7),
      new SubscriptionExceptionLabelLengthRule(32),
      new SubscriptionExceptionReviewerLengthRule(255),
    ],
  );
}
