import * as text from "../../../../kit/text.js";
import { CreditAgreement } from "./credit-agreement.js";

/** A rule a credit agreement must pass. Check returns its problems, or none. */
export interface CreditAgreementRule {
  check(item: CreditAgreement): string[];
}

export class CreditAgreementLabelLengthRule implements CreditAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditAgreementCodeLengthRule implements CreditAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditAgreementJourneyIdLengthRule implements CreditAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CreditAgreement): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CreditAgreementAllowedCodeRule implements CreditAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

/** Runs every rule of a credit agreement. */
export class CreditAgreementValidator {
  rules: CreditAgreementRule[];

  constructor(rules: CreditAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: CreditAgreement): string[] {
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

  requireValid(item: CreditAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditAgreement[]): Map<string, string[]> {
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

export function defaultCreditAgreementValidator(): CreditAgreementValidator {
  return new CreditAgreementValidator(
    [
      new CreditAgreementLabelLengthRule(120),
      new CreditAgreementCodeLengthRule(3600),
      new CreditAgreementJourneyIdLengthRule(1000),
      new CreditAgreementAllowedCodeRule(["tiered"]),
    ],
  );
}
