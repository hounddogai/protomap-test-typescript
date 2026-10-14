import * as text from "../../../../kit/text.js";
import { SubscriptionMilestone } from "./subscription-milestone.js";

/** A rule a subscription milestone must pass. Check returns its problems, or none. */
export interface SubscriptionMilestoneRule {
  check(item: SubscriptionMilestone): string[];
}

export class SubscriptionMilestoneRequiredCountryRule implements SubscriptionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionMilestone): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionMilestoneRequiredCodeRule implements SubscriptionMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionMilestoneCountryLengthRule implements SubscriptionMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionMilestone): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionMilestoneAllowedCodeRule implements SubscriptionMilestoneRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionMilestone): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is too long`];
    return [];
  }
}

export class SubscriptionMilestoneQuantityRangeRule implements SubscriptionMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionMilestone): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a subscription milestone. */
export class SubscriptionMilestoneValidator {
  rules: SubscriptionMilestoneRule[];

  constructor(rules: SubscriptionMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionMilestone): string[] {
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

  requireValid(item: SubscriptionMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionMilestone[]): Map<string, string[]> {
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

export function defaultSubscriptionMilestoneValidator(): SubscriptionMilestoneValidator {
  return new SubscriptionMilestoneValidator(
    [
      new SubscriptionMilestoneRequiredCountryRule("subscription milestone needs a value"),
      new SubscriptionMilestoneRequiredCodeRule("subscription milestone needs a value"),
      new SubscriptionMilestoneCountryLengthRule(64),
      new SubscriptionMilestoneAllowedCodeRule(["tiered", "global", "weighted"]),
      new SubscriptionMilestoneQuantityRangeRule(80, 120),
    ],
  );
}
