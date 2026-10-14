import * as text from "../../../../kit/text.js";
import { PaywallWindow } from "./paywall-window.js";

/** A rule a paywall window must pass. Check returns its problems, or none. */
export interface PaywallWindowRule {
  check(item: PaywallWindow): string[];
}

export class PaywallWindowRequiredRegionRule implements PaywallWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallWindow): string[] {
    if (item.region.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallWindowAllowedCodeRule implements PaywallWindowRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallWindow): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is expired`];
    return [];
  }
}

export class PaywallWindowUpdatedAtRangeRule implements PaywallWindowRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallWindow): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PaywallWindowCodePrefixRule implements PaywallWindowRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallWindow): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallWindowLabelLengthRule implements PaywallWindowRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallWindow): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallWindowRequiredCodeRule implements PaywallWindowRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallWindow): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall window. */
export class PaywallWindowValidator {
  rules: PaywallWindowRule[];

  constructor(rules: PaywallWindowRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallWindow): string[] {
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

  requireValid(item: PaywallWindow): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallWindow[]): Map<string, string[]> {
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

export function defaultPaywallWindowValidator(): PaywallWindowValidator {
  return new PaywallWindowValidator(
    [
      new PaywallWindowRequiredRegionRule("paywall window needs an entry"),
      new PaywallWindowAllowedCodeRule([]),
      new PaywallWindowUpdatedAtRangeRule(1000, 3600),
      new PaywallWindowCodePrefixRule("REF"),
      new PaywallWindowLabelLengthRule(16),
      new PaywallWindowRequiredCodeRule("paywall window needs this field"),
    ],
  );
}
