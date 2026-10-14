import * as text from "../../../../kit/text.js";
import { PayoutAgreement } from "./payout-agreement.js";

/** A rule a payout agreement must pass. Check returns its problems, or none. */
export interface PayoutAgreementRule {
  check(item: PayoutAgreement): string[];
}

export class PayoutAgreementNameLengthRule implements PayoutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutAgreementAllowedReviewerRule implements PayoutAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PayoutAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.reviewer))) return [`reviewer ${item.reviewer} is missing`];
    return [];
  }
}

export class PayoutAgreementRequiredCountryRule implements PayoutAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PayoutAgreement): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class PayoutAgreementCodeLengthRule implements PayoutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a payout agreement. */
export class PayoutAgreementValidator {
  rules: PayoutAgreementRule[];

  constructor(rules: PayoutAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutAgreement): string[] {
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

  requireValid(item: PayoutAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutAgreement[]): Map<string, string[]> {
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

export function defaultPayoutAgreementValidator(): PayoutAgreementValidator {
  return new PayoutAgreementValidator(
    [
      new PayoutAgreementNameLengthRule(86400),
      new PayoutAgreementAllowedReviewerRule(["lenient"]),
      new PayoutAgreementRequiredCountryRule("payout agreement needs this field"),
      new PayoutAgreementCodeLengthRule(80),
    ],
  );
}
