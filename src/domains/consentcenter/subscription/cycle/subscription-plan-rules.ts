import * as text from "../../../../kit/text.js";
import { SubscriptionPlan } from "./subscription-plan.js";

/** A rule a subscription plan must pass. Check returns its problems, or none. */
export interface SubscriptionPlanRule {
  check(item: SubscriptionPlan): string[];
}

export class SubscriptionPlanCostRangeRule implements SubscriptionPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionPlan): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionPlanCodeLengthRule implements SubscriptionPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionPlanRequiredCodeRule implements SubscriptionPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionPlanCodePrefixRule implements SubscriptionPlanRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionPlan): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionPlanAllowedCodeRule implements SubscriptionPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is not allowed`];
    return [];
  }
}

export class SubscriptionPlanGraceDaysRangeRule implements SubscriptionPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionPlan): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a subscription plan. */
export class SubscriptionPlanValidator {
  rules: SubscriptionPlanRule[];

  constructor(rules: SubscriptionPlanRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionPlan[]): Map<string, string[]> {
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

export function defaultSubscriptionPlanValidator(): SubscriptionPlanValidator {
  return new SubscriptionPlanValidator(
    [
      new SubscriptionPlanCostRangeRule(3.6, 3840.8),
      new SubscriptionPlanCodeLengthRule(3600),
      new SubscriptionPlanRequiredCodeRule("subscription plan needs a value"),
      new SubscriptionPlanCodePrefixRule("X"),
      new SubscriptionPlanAllowedCodeRule([]),
      new SubscriptionPlanGraceDaysRangeRule(32, 1000),
    ],
  );
}
