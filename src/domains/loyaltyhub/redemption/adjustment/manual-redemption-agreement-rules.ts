import * as text from "../../../../kit/text.js";
import { ManualRedemptionAgreement } from "./manual-redemption-agreement.js";

/** A rule a manual redemption agreement must pass. Check returns its problems, or none. */
export interface ManualRedemptionAgreementRule {
  check(item: ManualRedemptionAgreement): string[];
}

export class ManualRedemptionAgreementLocaleLengthRule implements ManualRedemptionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRedemptionAgreement): string[] {
    const size = item.locale.length;
    if (size > this.maxLength) return [`locale is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRedemptionAgreementRequiredCodeRule implements ManualRedemptionAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualRedemptionAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualRedemptionAgreementCodeLengthRule implements ManualRedemptionAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualRedemptionAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualRedemptionAgreementConversionRateRangeRule implements ManualRedemptionAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualRedemptionAgreement): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualRedemptionAgreementCodePrefixRule implements ManualRedemptionAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualRedemptionAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualRedemptionAgreementAllowedLocaleRule implements ManualRedemptionAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualRedemptionAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is missing`];
    return [];
  }
}

/** Runs every rule of a manual redemption agreement. */
export class ManualRedemptionAgreementValidator {
  rules: ManualRedemptionAgreementRule[];

  constructor(rules: ManualRedemptionAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ManualRedemptionAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualRedemptionAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualRedemptionAgreement[]): Map<string, string[]> {
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

export function defaultManualRedemptionAgreementValidator(): ManualRedemptionAgreementValidator {
  return new ManualRedemptionAgreementValidator(
    [
      new ManualRedemptionAgreementLocaleLengthRule(32),
      new ManualRedemptionAgreementRequiredCodeRule("manual redemption agreement needs a value"),
      new ManualRedemptionAgreementCodeLengthRule(16),
      new ManualRedemptionAgreementConversionRateRangeRule(3.4, 1592.3),
      new ManualRedemptionAgreementCodePrefixRule("REF"),
      new ManualRedemptionAgreementAllowedLocaleRule(["fallback", "tiered", "manual"]),
    ],
  );
}
