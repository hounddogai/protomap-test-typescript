import * as text from "../../../../kit/text.js";
import { SubscriptionBaseline } from "./subscription-baseline.js";

/** A rule a subscription baseline must pass. Check returns its problems, or none. */
export interface SubscriptionBaselineRule {
  check(item: SubscriptionBaseline): string[];
}

export class SubscriptionBaselineRatioRangeRule implements SubscriptionBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionBaseline): string[] {
    const value = item.ratio;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ratio ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ratio ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionBaselineRequiredCampaignRefRule implements SubscriptionBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionBaseline): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionBaselineSegmentLengthRule implements SubscriptionBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionBaseline): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionBaselineCodePrefixRule implements SubscriptionBaselineRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionBaseline): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionBaselineGraceDaysRangeRule implements SubscriptionBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionBaseline): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionBaselineAllowedCodeRule implements SubscriptionBaselineRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionBaseline): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

/** Runs every rule of a subscription baseline. */
export class SubscriptionBaselineValidator {
  rules: SubscriptionBaselineRule[];

  constructor(rules: SubscriptionBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionBaseline[]): Map<string, string[]> {
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

export function defaultSubscriptionBaselineValidator(): SubscriptionBaselineValidator {
  return new SubscriptionBaselineValidator(
    [
      new SubscriptionBaselineRatioRangeRule(7.2, 4872.4),
      new SubscriptionBaselineRequiredCampaignRefRule("subscription baseline needs a value"),
      new SubscriptionBaselineSegmentLengthRule(86400),
      new SubscriptionBaselineCodePrefixRule("X"),
      new SubscriptionBaselineGraceDaysRangeRule(1000, 1000),
      new SubscriptionBaselineAllowedCodeRule(["legacy", "tiered"]),
    ],
  );
}
