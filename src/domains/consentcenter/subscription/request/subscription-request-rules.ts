import * as text from "../../../../kit/text.js";
import { SubscriptionRequest } from "./subscription-request.js";

/** A rule a subscription request must pass. Check returns its problems, or none. */
export interface SubscriptionRequestRule {
  check(item: SubscriptionRequest): string[];
}

export class SubscriptionRequestRequiredLocaleRule implements SubscriptionRequestRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionRequest): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionRequestExpiresAtRangeRule implements SubscriptionRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionRequest): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionRequestFrequencyCapRangeRule implements SubscriptionRequestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionRequest): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionRequestAllowedLabelRule implements SubscriptionRequestRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionRequest): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is below minimum`];
    return [];
  }
}

/** Runs every rule of a subscription request. */
export class SubscriptionRequestValidator {
  rules: SubscriptionRequestRule[];

  constructor(rules: SubscriptionRequestRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionRequest): string[] {
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

  requireValid(item: SubscriptionRequest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionRequest[]): Map<string, string[]> {
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

export function defaultSubscriptionRequestValidator(): SubscriptionRequestValidator {
  return new SubscriptionRequestValidator(
    [
      new SubscriptionRequestRequiredLocaleRule("subscription request needs this field"),
      new SubscriptionRequestExpiresAtRangeRule(32, 32),
      new SubscriptionRequestFrequencyCapRangeRule(120, 255),
      new SubscriptionRequestAllowedLabelRule(["seasonal"]),
    ],
  );
}
