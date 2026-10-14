import * as text from "../../../../kit/text.js";
import { SubscriptionCycle } from "./subscription-cycle.js";

/** A rule a subscription cycle must pass. Check returns its problems, or none. */
export interface SubscriptionCycleRule {
  check(item: SubscriptionCycle): string[];
}

export class SubscriptionCycleRequiredTitleRule implements SubscriptionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionCycle): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionCycleWindowDaysRangeRule implements SubscriptionCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionCycle): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionCycleCodePrefixRule implements SubscriptionCycleRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionCycle): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionCycleTitleLengthRule implements SubscriptionCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionCycleRequiredSourceRule implements SubscriptionCycleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionCycle): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionCycleAllowedLocaleRule implements SubscriptionCycleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionCycle): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is too long`];
    return [];
  }
}

/** Runs every rule of a subscription cycle. */
export class SubscriptionCycleValidator {
  rules: SubscriptionCycleRule[];

  constructor(rules: SubscriptionCycleRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionCycle[]): Map<string, string[]> {
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

export function defaultSubscriptionCycleValidator(): SubscriptionCycleValidator {
  return new SubscriptionCycleValidator(
    [
      new SubscriptionCycleRequiredTitleRule("subscription cycle needs an entry"),
      new SubscriptionCycleWindowDaysRangeRule(120, 1000),
      new SubscriptionCycleCodePrefixRule("Q"),
      new SubscriptionCycleTitleLengthRule(1000),
      new SubscriptionCycleRequiredSourceRule("subscription cycle needs a value"),
      new SubscriptionCycleAllowedLocaleRule(["tiered"]),
    ],
  );
}
