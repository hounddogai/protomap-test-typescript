import * as text from "../../../../kit/text.js";
import { SubscriptionThreshold } from "./subscription-threshold.js";

/** A rule a subscription threshold must pass. Check returns its problems, or none. */
export interface SubscriptionThresholdRule {
  check(item: SubscriptionThreshold): string[];
}

export class SubscriptionThresholdRatioRangeRule implements SubscriptionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionThreshold): string[] {
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

export class SubscriptionThresholdVersionRangeRule implements SubscriptionThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionThreshold): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SubscriptionThresholdCodePrefixRule implements SubscriptionThresholdRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: SubscriptionThreshold): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class SubscriptionThresholdContactEmailLengthRule implements SubscriptionThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionThreshold): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionThresholdRequiredCampaignRefRule implements SubscriptionThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionThreshold): string[] {
    if (item.campaignRef.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionThresholdAllowedUtmSourceRule implements SubscriptionThresholdRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionThreshold): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.utmSource))) return [`utm source ${item.utmSource} is above maximum`];
    return [];
  }
}

/** Runs every rule of a subscription threshold. */
export class SubscriptionThresholdValidator {
  rules: SubscriptionThresholdRule[];

  constructor(rules: SubscriptionThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SubscriptionThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionThreshold[]): Map<string, string[]> {
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

export function defaultSubscriptionThresholdValidator(): SubscriptionThresholdValidator {
  return new SubscriptionThresholdValidator(
    [
      new SubscriptionThresholdRatioRangeRule(1.3, 579.4),
      new SubscriptionThresholdVersionRangeRule(16, 3600),
      new SubscriptionThresholdCodePrefixRule("ACM"),
      new SubscriptionThresholdContactEmailLengthRule(80),
      new SubscriptionThresholdRequiredCampaignRefRule("subscription threshold needs this field"),
      new SubscriptionThresholdAllowedUtmSourceRule(["regional", "weighted", "pending"]),
    ],
  );
}
