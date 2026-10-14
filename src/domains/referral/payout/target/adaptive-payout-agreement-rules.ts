import * as text from "../../../../kit/text.js";
import { AdaptivePayoutAgreement } from "./adaptive-payout-agreement.js";

/** A rule a adaptive payout agreement must pass. Check returns its problems, or none. */
export interface AdaptivePayoutAgreementRule {
  check(item: AdaptivePayoutAgreement): string[];
}

export class AdaptivePayoutAgreementCodePrefixRule implements AdaptivePayoutAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptivePayoutAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptivePayoutAgreementNotesLengthRule implements AdaptivePayoutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePayoutAgreement): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePayoutAgreementCodeLengthRule implements AdaptivePayoutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePayoutAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePayoutAgreementAllowedOwnerIdRule implements AdaptivePayoutAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptivePayoutAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is stale`];
    return [];
  }
}

export class AdaptivePayoutAgreementImpressionsRangeRule implements AdaptivePayoutAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePayoutAgreement): string[] {
    const value = item.impressions;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`impressions ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`impressions ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive payout agreement. */
export class AdaptivePayoutAgreementValidator {
  rules: AdaptivePayoutAgreementRule[];

  constructor(rules: AdaptivePayoutAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePayoutAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptivePayoutAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePayoutAgreement[]): Map<string, string[]> {
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

export function defaultAdaptivePayoutAgreementValidator(): AdaptivePayoutAgreementValidator {
  return new AdaptivePayoutAgreementValidator(
    [
      new AdaptivePayoutAgreementCodePrefixRule("REF"),
      new AdaptivePayoutAgreementNotesLengthRule(16),
      new AdaptivePayoutAgreementCodeLengthRule(1000),
      new AdaptivePayoutAgreementAllowedOwnerIdRule(["seasonal", "tiered", "manual"]),
      new AdaptivePayoutAgreementImpressionsRangeRule(80, 120),
    ],
  );
}
