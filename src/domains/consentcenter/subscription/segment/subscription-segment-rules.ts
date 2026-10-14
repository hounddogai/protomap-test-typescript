import * as text from "../../../../kit/text.js";
import { SubscriptionSegment } from "./subscription-segment.js";

/** A rule a subscription segment must pass. Check returns its problems, or none. */
export interface SubscriptionSegmentRule {
  check(item: SubscriptionSegment): string[];
}

export class SubscriptionSegmentAllowedTimezoneRule implements SubscriptionSegmentRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SubscriptionSegment): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is not allowed`];
    return [];
  }
}

export class SubscriptionSegmentCodeLengthRule implements SubscriptionSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SubscriptionSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SubscriptionSegmentRequiredCodeRule implements SubscriptionSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SubscriptionSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SubscriptionSegmentRateRangeRule implements SubscriptionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionSegment): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class SubscriptionSegmentRevisionRangeRule implements SubscriptionSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SubscriptionSegment): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a subscription segment. */
export class SubscriptionSegmentValidator {
  rules: SubscriptionSegmentRule[];

  constructor(rules: SubscriptionSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: SubscriptionSegment): string[] {
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

  requireValid(item: SubscriptionSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SubscriptionSegment[]): Map<string, string[]> {
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

export function defaultSubscriptionSegmentValidator(): SubscriptionSegmentValidator {
  return new SubscriptionSegmentValidator(
    [
      new SubscriptionSegmentAllowedTimezoneRule(["rolling"]),
      new SubscriptionSegmentCodeLengthRule(64),
      new SubscriptionSegmentRequiredCodeRule("subscription segment needs an entry"),
      new SubscriptionSegmentRateRangeRule(2.6, 1776.7),
      new SubscriptionSegmentRevisionRangeRule(1000, 1000),
    ],
  );
}
