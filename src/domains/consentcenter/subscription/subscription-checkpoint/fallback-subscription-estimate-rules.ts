import * as text from "../../../../kit/text.js";
import { FallbackSubscriptionEstimate } from "./fallback-subscription-estimate.js";

/** A rule a fallback subscription estimate must pass. Check returns its problems, or none. */
export interface FallbackSubscriptionEstimateRule {
  check(item: FallbackSubscriptionEstimate): string[];
}

export class FallbackSubscriptionEstimateQuantityRangeRule implements FallbackSubscriptionEstimateRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackSubscriptionEstimate): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackSubscriptionEstimateAllowedCodeRule implements FallbackSubscriptionEstimateRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackSubscriptionEstimate): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class FallbackSubscriptionEstimateCodePrefixRule implements FallbackSubscriptionEstimateRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackSubscriptionEstimate): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackSubscriptionEstimateContactEmailLengthRule implements FallbackSubscriptionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSubscriptionEstimate): string[] {
    const size = item.contactEmail.length;
    if (size > this.maxLength) return [`contact email is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackSubscriptionEstimatePhoneLengthRule implements FallbackSubscriptionEstimateRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackSubscriptionEstimate): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a fallback subscription estimate. */
export class FallbackSubscriptionEstimateValidator {
  rules: FallbackSubscriptionEstimateRule[];

  constructor(rules: FallbackSubscriptionEstimateRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackSubscriptionEstimate): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackSubscriptionEstimate): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackSubscriptionEstimate[]): Map<string, string[]> {
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

export function defaultFallbackSubscriptionEstimateValidator(): FallbackSubscriptionEstimateValidator {
  return new FallbackSubscriptionEstimateValidator(
    [
      new FallbackSubscriptionEstimateQuantityRangeRule(120, 120),
      new FallbackSubscriptionEstimateAllowedCodeRule([]),
      new FallbackSubscriptionEstimateCodePrefixRule("REF"),
      new FallbackSubscriptionEstimateContactEmailLengthRule(80),
      new FallbackSubscriptionEstimatePhoneLengthRule(255),
    ],
  );
}
