import * as text from "../../../../kit/text.js";
import { PaywallEntry } from "./paywall-entry.js";

/** A rule a paywall entry must pass. Check returns its problems, or none. */
export interface PaywallEntryRule {
  check(item: PaywallEntry): string[];
}

export class PaywallEntryExpiresAtRangeRule implements PaywallEntryRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallEntry): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PaywallEntryAllowedCodeRule implements PaywallEntryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallEntry): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class PaywallEntryNameLengthRule implements PaywallEntryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallEntry): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallEntryRequiredCodeRule implements PaywallEntryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallEntry): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall entry. */
export class PaywallEntryValidator {
  rules: PaywallEntryRule[];

  constructor(rules: PaywallEntryRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallEntry): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallEntry): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallEntry[]): Map<string, string[]> {
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

export function defaultPaywallEntryValidator(): PaywallEntryValidator {
  return new PaywallEntryValidator(
    [
      new PaywallEntryExpiresAtRangeRule(120, 120),
      new PaywallEntryAllowedCodeRule(["seasonal", "default"]),
      new PaywallEntryNameLengthRule(16),
      new PaywallEntryRequiredCodeRule("paywall entry needs an entry"),
    ],
  );
}
