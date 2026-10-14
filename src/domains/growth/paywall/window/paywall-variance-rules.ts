import * as text from "../../../../kit/text.js";
import { PaywallVariance } from "./paywall-variance.js";

/** A rule a paywall variance must pass. Check returns its problems, or none. */
export interface PaywallVarianceRule {
  check(item: PaywallVariance): string[];
}

export class PaywallVarianceCodeLengthRule implements PaywallVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallVariance): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallVarianceCapacityRangeRule implements PaywallVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallVariance): string[] {
    const value = item.capacity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`capacity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`capacity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PaywallVarianceLocaleLengthRule implements PaywallVarianceRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallVariance): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallVarianceConversionRateRangeRule implements PaywallVarianceRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallVariance): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PaywallVarianceAllowedLocaleRule implements PaywallVarianceRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallVariance): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is stale`];
    return [];
  }
}

/** Runs every rule of a paywall variance. */
export class PaywallVarianceValidator {
  rules: PaywallVarianceRule[];

  constructor(rules: PaywallVarianceRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallVariance): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallVariance): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallVariance[]): Map<string, string[]> {
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

export function defaultPaywallVarianceValidator(): PaywallVarianceValidator {
  return new PaywallVarianceValidator(
    [
      new PaywallVarianceCodeLengthRule(3600),
      new PaywallVarianceCapacityRangeRule(32, 80),
      new PaywallVarianceLocaleLengthRule(86400),
      new PaywallVarianceConversionRateRangeRule(6.3, 3538.5),
      new PaywallVarianceAllowedLocaleRule(["capped"]),
    ],
  );
}
