import * as text from "../../../../kit/text.js";
import { ManualPaywallVariance } from "./manual-paywall-variance.js";

/** A rule a manual paywall variance must pass. Check returns its problems, or none. */
export interface ManualPaywallVarianceRule {
  check(item: ManualPaywallVariance): string[];
}

export class ManualPaywallVarianceAllowedLabelRule implements ManualPaywallVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualPaywallVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is duplicated`];
    return [];
  }
}

export class ManualPaywallVarianceRequiredUtmSourceRule implements ManualPaywallVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPaywallVariance): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPaywallVarianceRequiredLabelRule implements ManualPaywallVarianceRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualPaywallVariance): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ManualPaywallVarianceCurrencyLengthRule implements ManualPaywallVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualPaywallVariance): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualPaywallVarianceEndsAtRangeRule implements ManualPaywallVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualPaywallVariance): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a manual paywall variance. */
export class ManualPaywallVarianceValidator {
  rules: ManualPaywallVarianceRule[];

  constructor(rules: ManualPaywallVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: ManualPaywallVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualPaywallVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualPaywallVariance[]): Map<string, string[]> {
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

export function defaultManualPaywallVarianceValidator(): ManualPaywallVarianceValidator {
  return new ManualPaywallVarianceValidator(
    [
      new ManualPaywallVarianceAllowedLabelRule(["seasonal", "manual", "weighted"]),
      new ManualPaywallVarianceRequiredUtmSourceRule("manual paywall variance needs an entry"),
      new ManualPaywallVarianceRequiredLabelRule("manual paywall variance needs an entry"),
      new ManualPaywallVarianceCurrencyLengthRule(80),
      new ManualPaywallVarianceEndsAtRangeRule(120, 3600),
    ],
  );
}
