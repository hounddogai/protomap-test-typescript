import * as text from "../../../../kit/text.js";
import { FallbackPayoutAgreement } from "./fallback-payout-agreement.js";

/** A rule a fallback payout agreement must pass. Check returns its problems, or none. */
export interface FallbackPayoutAgreementRule {
  check(item: FallbackPayoutAgreement): string[];
}

export class FallbackPayoutAgreementThresholdRangeRule implements FallbackPayoutAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPayoutAgreement): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPayoutAgreementCodeLengthRule implements FallbackPayoutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPayoutAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPayoutAgreementLabelLengthRule implements FallbackPayoutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPayoutAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPayoutAgreementMinimumRangeRule implements FallbackPayoutAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPayoutAgreement): string[] {
    const value = item.minimum;
    if (value < this.min || value > this.max) return [`minimum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class FallbackPayoutAgreementCodePrefixRule implements FallbackPayoutAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: FallbackPayoutAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class FallbackPayoutAgreementAllowedLabelRule implements FallbackPayoutAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: FallbackPayoutAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

/** Runs every rule of a fallback payout agreement. */
export class FallbackPayoutAgreementValidator {
  rules: FallbackPayoutAgreementRule[];

  constructor(rules: FallbackPayoutAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPayoutAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackPayoutAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPayoutAgreement[]): Map<string, string[]> {
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

export function defaultFallbackPayoutAgreementValidator(): FallbackPayoutAgreementValidator {
  return new FallbackPayoutAgreementValidator(
    [
      new FallbackPayoutAgreementThresholdRangeRule(5.7, 3655.1),
      new FallbackPayoutAgreementCodeLengthRule(255),
      new FallbackPayoutAgreementLabelLengthRule(3600),
      new FallbackPayoutAgreementMinimumRangeRule(1.6, 4030.7),
      new FallbackPayoutAgreementCodePrefixRule("ACM"),
      new FallbackPayoutAgreementAllowedLabelRule(["lenient", "rolling", "seasonal"]),
    ],
  );
}
