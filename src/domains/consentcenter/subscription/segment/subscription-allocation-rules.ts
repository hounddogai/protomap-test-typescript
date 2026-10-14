import * as text from "../../../../kit/text.js";
import { SubscriptionAllocation } from "./subscription-allocation.js";

/** A rule a subscription allocation must pass. Check returns its problems, or none. */
export interface SubscriptionAllocationRule {
  check(item: SubscriptionAllocation): string[];
}

export class SubscriptionAllocationActiveGuardRule implements SubscriptionAllocationRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: SubscriptionAllocation): string[] {
    if (item.active && item.createdAt > this.limit) return [`created at ${item.createdAt} exceeds ${this.limit} while active`];
    return [];
  }
}

export class SubscriptionAllocationRequiredCodeRule implements SubscriptionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionAllocation): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionAllocationRequiredLocaleRule implements SubscriptionAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionAllocation): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionAllocationCreatedAtRangeRule implements SubscriptionAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionAllocation): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionAllocationLocaleLengthRule implements SubscriptionAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionAllocation): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionAllocationAllowedTitleRule implements SubscriptionAllocationRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionAllocation): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is above maximum`];
    return [];
  }
}

/** Runs every rule of a subscription allocation. */
export class SubscriptionAllocationValidator {
  rules: SubscriptionAllocationRule[];

  constructor(rules: SubscriptionAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionAllocation[]): Map<string, string[]> {
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

export function defaultSubscriptionAllocationValidator(): SubscriptionAllocationValidator {
  return new SubscriptionAllocationValidator(
    [
      new SubscriptionAllocationActiveGuardRule(16),
      new SubscriptionAllocationRequiredCodeRule("subscription allocation needs a value"),
      new SubscriptionAllocationRequiredLocaleRule("subscription allocation needs an entry"),
      new SubscriptionAllocationCreatedAtRangeRule(64, 80),
      new SubscriptionAllocationLocaleLengthRule(80),
      new SubscriptionAllocationAllowedTitleRule([]),
    ],
  );
}
