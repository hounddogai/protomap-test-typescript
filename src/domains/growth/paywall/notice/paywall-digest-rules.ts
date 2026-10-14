import { PaywallDigest } from "./paywall-digest.js";

/** A rule a paywall digest must pass. Check returns its problems, or none. */
export interface PaywallDigestRule {
  check(item: PaywallDigest): string[];
}

export class PaywallDigestDiscountRangeRule implements PaywallDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallDigest): string[] {
    const value = item.discount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`discount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`discount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PaywallDigestCodePrefixRule implements PaywallDigestRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallDigest): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallDigestCodeLengthRule implements PaywallDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallDigestLabelLengthRule implements PaywallDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallDigest): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a paywall digest. */
export class PaywallDigestValidator {
  rules: PaywallDigestRule[];

  constructor(rules: PaywallDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallDigest): string[] {
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

  requireValid(item: PaywallDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallDigest[]): Map<string, string[]> {
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

export function defaultPaywallDigestValidator(): PaywallDigestValidator {
  return new PaywallDigestValidator(
    [
      new PaywallDigestDiscountRangeRule(7, 4953.3),
      new PaywallDigestCodePrefixRule("X"),
      new PaywallDigestCodeLengthRule(64),
      new PaywallDigestLabelLengthRule(120),
    ],
  );
}
