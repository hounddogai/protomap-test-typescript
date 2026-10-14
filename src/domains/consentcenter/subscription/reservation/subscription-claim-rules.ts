import * as text from "../../../../kit/text.js";
import { SubscriptionClaim } from "./subscription-claim.js";

/** A rule a subscription claim must pass. Check returns its problems, or none. */
export interface SubscriptionClaimRule {
  check(item: SubscriptionClaim): string[];
}

export class SubscriptionClaimChannelLengthRule implements SubscriptionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionClaim): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionClaimAllowedChannelRule implements SubscriptionClaimRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionClaim): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.channel))) return [`channel ${item.channel} is not allowed`];
    return [];
  }
}

export class SubscriptionClaimPriorityRangeRule implements SubscriptionClaimRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionClaim): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionClaimCodeLengthRule implements SubscriptionClaimRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionClaim): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a subscription claim. */
export class SubscriptionClaimValidator {
  rules: SubscriptionClaimRule[];

  constructor(rules: SubscriptionClaimRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionClaim): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionClaim): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionClaim[]): Map<string, string[]> {
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

export function defaultSubscriptionClaimValidator(): SubscriptionClaimValidator {
  return new SubscriptionClaimValidator(
    [
      new SubscriptionClaimChannelLengthRule(64),
      new SubscriptionClaimAllowedChannelRule(["legacy"]),
      new SubscriptionClaimPriorityRangeRule(64, 120),
      new SubscriptionClaimCodeLengthRule(1000),
    ],
  );
}
