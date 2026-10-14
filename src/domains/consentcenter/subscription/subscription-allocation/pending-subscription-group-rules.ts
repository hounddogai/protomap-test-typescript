import * as text from "../../../../kit/text.js";
import { PendingSubscriptionGroup } from "./pending-subscription-group.js";

/** A rule a pending subscription group must pass. Check returns its problems, or none. */
export interface PendingSubscriptionGroupRule {
  check(item: PendingSubscriptionGroup): string[];
}

export class PendingSubscriptionGroupRequiredCodeRule implements PendingSubscriptionGroupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingSubscriptionGroup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PendingSubscriptionGroupLabelLengthRule implements PendingSubscriptionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSubscriptionGroup): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingSubscriptionGroupExpiresAtRangeRule implements PendingSubscriptionGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingSubscriptionGroup): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingSubscriptionGroupAllowedDescriptionRule implements PendingSubscriptionGroupRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingSubscriptionGroup): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is stale`];
    return [];
  }
}

export class PendingSubscriptionGroupCodeLengthRule implements PendingSubscriptionGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingSubscriptionGroup): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending subscription group. */
export class PendingSubscriptionGroupValidator {
  rules: PendingSubscriptionGroupRule[];

  constructor(rules: PendingSubscriptionGroupRule[]) {
    this.rules = rules;
  }

  validate(item: PendingSubscriptionGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingSubscriptionGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingSubscriptionGroup[]): Map<string, string[]> {
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

export function defaultPendingSubscriptionGroupValidator(): PendingSubscriptionGroupValidator {
  return new PendingSubscriptionGroupValidator(
    [
      new PendingSubscriptionGroupRequiredCodeRule("pending subscription group needs this field"),
      new PendingSubscriptionGroupLabelLengthRule(255),
      new PendingSubscriptionGroupExpiresAtRangeRule(120, 255),
      new PendingSubscriptionGroupAllowedDescriptionRule([]),
      new PendingSubscriptionGroupCodeLengthRule(120),
    ],
  );
}
