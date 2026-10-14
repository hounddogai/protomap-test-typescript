import { PaywallAgreement } from "./paywall-agreement.js";

/** A rule a paywall agreement must pass. Check returns its problems, or none. */
export interface PaywallAgreementRule {
  check(item: PaywallAgreement): string[];
}

export class PaywallAgreementTitleLengthRule implements PaywallAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallAgreementFloorValueRangeRule implements PaywallAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallAgreement): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PaywallAgreementRequiredNotesRule implements PaywallAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallAgreement): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallAgreementRequiredCodeRule implements PaywallAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallAgreement): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a paywall agreement. */
export class PaywallAgreementValidator {
  rules: PaywallAgreementRule[];

  constructor(rules: PaywallAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallAgreement): string[] {
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

  requireValid(item: PaywallAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallAgreement[]): Map<string, string[]> {
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

export function defaultPaywallAgreementValidator(): PaywallAgreementValidator {
  return new PaywallAgreementValidator(
    [
      new PaywallAgreementTitleLengthRule(64),
      new PaywallAgreementFloorValueRangeRule(7.7, 2840.8),
      new PaywallAgreementRequiredNotesRule("paywall agreement needs this field"),
      new PaywallAgreementRequiredCodeRule("paywall agreement needs an entry"),
    ],
  );
}
