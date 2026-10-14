import * as text from "../../../../kit/text.js";
import { EnrollmentAgreement } from "./enrollment-agreement.js";

/** A rule a enrollment agreement must pass. Check returns its problems, or none. */
export interface EnrollmentAgreementRule {
  check(item: EnrollmentAgreement): string[];
}

export class EnrollmentAgreementCodePrefixRule implements EnrollmentAgreementRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentAgreement): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentAgreementAllowedContactEmailRule implements EnrollmentAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.contactEmail))) return [`contact email ${item.contactEmail} is not allowed`];
    return [];
  }
}

export class EnrollmentAgreementJourneyIdLengthRule implements EnrollmentAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentAgreement): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment agreement. */
export class EnrollmentAgreementValidator {
  rules: EnrollmentAgreementRule[];

  constructor(rules: EnrollmentAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentAgreement[]): Map<string, string[]> {
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

export function defaultEnrollmentAgreementValidator(): EnrollmentAgreementValidator {
  return new EnrollmentAgreementValidator(
    [
      new EnrollmentAgreementCodePrefixRule("REF"),
      new EnrollmentAgreementAllowedContactEmailRule([]),
      new EnrollmentAgreementJourneyIdLengthRule(1000),
    ],
  );
}
