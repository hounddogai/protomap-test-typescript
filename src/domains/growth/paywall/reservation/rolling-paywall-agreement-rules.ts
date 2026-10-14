import * as text from "../../../../kit/text.js";
import { RollingPaywallAgreement } from "./rolling-paywall-agreement.js";

/** A rule a rolling paywall agreement must pass. Check returns its problems, or none. */
export interface RollingPaywallAgreementRule {
  check(item: RollingPaywallAgreement): string[];
}

export class RollingPaywallAgreementCodeLengthRule implements RollingPaywallAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPaywallAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPaywallAgreementVariantLengthRule implements RollingPaywallAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPaywallAgreement): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingPaywallAgreementCapacityRangeRule implements RollingPaywallAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingPaywallAgreement): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingPaywallAgreementAllowedCodeRule implements RollingPaywallAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RollingPaywallAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class RollingPaywallAgreementRequiredVariantRule implements RollingPaywallAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingPaywallAgreement): string[] {
    if (item.variant.trim() === "") return [this.message];
    return [];
  }
}

export class RollingPaywallAgreementLabelLengthRule implements RollingPaywallAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingPaywallAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a rolling paywall agreement. */
export class RollingPaywallAgreementValidator {
  rules: RollingPaywallAgreementRule[];

  constructor(rules: RollingPaywallAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: RollingPaywallAgreement): string[] {
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

  requireValid(item: RollingPaywallAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingPaywallAgreement[]): Map<string, string[]> {
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

export function defaultRollingPaywallAgreementValidator(): RollingPaywallAgreementValidator {
  return new RollingPaywallAgreementValidator(
    [
      new RollingPaywallAgreementCodeLengthRule(64),
      new RollingPaywallAgreementVariantLengthRule(1000),
      new RollingPaywallAgreementCapacityRangeRule(16, 64),
      new RollingPaywallAgreementAllowedCodeRule(["lenient"]),
      new RollingPaywallAgreementRequiredVariantRule("rolling paywall agreement needs an entry"),
      new RollingPaywallAgreementLabelLengthRule(3600),
    ],
  );
}
