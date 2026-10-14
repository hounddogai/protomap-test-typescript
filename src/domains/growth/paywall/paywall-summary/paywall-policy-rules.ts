import * as text from "../../../../kit/text.js";
import { PaywallPolicy } from "./paywall-policy.js";

/** A rule a paywall policy must pass. Check returns its problems, or none. */
export interface PaywallPolicyRule {
  check(item: PaywallPolicy): string[];
}

export class PaywallPolicyRequiredSummaryRule implements PaywallPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallPolicy): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallPolicySummaryLengthRule implements PaywallPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallPolicy): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallPolicyWindowDaysRangeRule implements PaywallPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallPolicy): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PaywallPolicyAllowedSummaryRule implements PaywallPolicyRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallPolicy): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.summary))) return [`summary ${item.summary} is below minimum`];
    return [];
  }
}

export class PaywallPolicyNameLengthRule implements PaywallPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallPolicy): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallPolicyRequiredDescriptionRule implements PaywallPolicyRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallPolicy): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall policy. */
export class PaywallPolicyValidator {
  rules: PaywallPolicyRule[];

  constructor(rules: PaywallPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallPolicy): string[] {
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

  requireValid(item: PaywallPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallPolicy[]): Map<string, string[]> {
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

export function defaultPaywallPolicyValidator(): PaywallPolicyValidator {
  return new PaywallPolicyValidator(
    [
      new PaywallPolicyRequiredSummaryRule("paywall policy needs this field"),
      new PaywallPolicySummaryLengthRule(120),
      new PaywallPolicyWindowDaysRangeRule(255, 86400),
      new PaywallPolicyAllowedSummaryRule(["strict", "seasonal"]),
      new PaywallPolicyNameLengthRule(120),
      new PaywallPolicyRequiredDescriptionRule("paywall policy needs this field"),
    ],
  );
}
