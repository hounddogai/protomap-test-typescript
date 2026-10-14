import * as text from "../../../../kit/text.js";
import { LenientBranchAgreement } from "./lenient-branch-agreement.js";

/** A rule a lenient branch agreement must pass. Check returns its problems, or none. */
export interface LenientBranchAgreementRule {
  check(item: LenientBranchAgreement): string[];
}

export class LenientBranchAgreementCodeLengthRule implements LenientBranchAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBranchAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBranchAgreementRequiredPhoneRule implements LenientBranchAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientBranchAgreement): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LenientBranchAgreementPhoneLengthRule implements LenientBranchAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBranchAgreement): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBranchAgreementTitleLengthRule implements LenientBranchAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientBranchAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientBranchAgreementAllowedCategoryRule implements LenientBranchAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientBranchAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is inconsistent`];
    return [];
  }
}

/** Runs every rule of a lenient branch agreement. */
export class LenientBranchAgreementValidator {
  rules: LenientBranchAgreementRule[];

  constructor(rules: LenientBranchAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: LenientBranchAgreement): string[] {
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

  requireValid(item: LenientBranchAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientBranchAgreement[]): Map<string, string[]> {
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

export function defaultLenientBranchAgreementValidator(): LenientBranchAgreementValidator {
  return new LenientBranchAgreementValidator(
    [
      new LenientBranchAgreementCodeLengthRule(80),
      new LenientBranchAgreementRequiredPhoneRule("lenient branch agreement needs an entry"),
      new LenientBranchAgreementPhoneLengthRule(86400),
      new LenientBranchAgreementTitleLengthRule(16),
      new LenientBranchAgreementAllowedCategoryRule([]),
    ],
  );
}
