import * as text from "../../../../kit/text.js";
import { AdaptivePaywallAgreement } from "./adaptive-paywall-agreement.js";

/** A rule a adaptive paywall agreement must pass. Check returns its problems, or none. */
export interface AdaptivePaywallAgreementRule {
  check(item: AdaptivePaywallAgreement): string[];
}

export class AdaptivePaywallAgreementAllowedNotesRule implements AdaptivePaywallAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptivePaywallAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is stale`];
    return [];
  }
}

export class AdaptivePaywallAgreementTitleLengthRule implements AdaptivePaywallAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptivePaywallAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptivePaywallAgreementImpressionsRangeRule implements AdaptivePaywallAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptivePaywallAgreement): string[] {
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

/** Runs every rule of a adaptive paywall agreement. */
export class AdaptivePaywallAgreementValidator {
  rules: AdaptivePaywallAgreementRule[];

  constructor(rules: AdaptivePaywallAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptivePaywallAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptivePaywallAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptivePaywallAgreement[]): Map<string, string[]> {
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

export function defaultAdaptivePaywallAgreementValidator(): AdaptivePaywallAgreementValidator {
  return new AdaptivePaywallAgreementValidator(
    [
      new AdaptivePaywallAgreementAllowedNotesRule(["fallback", "batched"]),
      new AdaptivePaywallAgreementTitleLengthRule(80),
      new AdaptivePaywallAgreementImpressionsRangeRule(16, 64),
    ],
  );
}
