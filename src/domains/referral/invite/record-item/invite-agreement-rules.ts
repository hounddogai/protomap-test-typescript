import * as text from "../../../../kit/text.js";
import { InviteAgreement } from "./invite-agreement.js";

/** A rule a invite agreement must pass. Check returns its problems, or none. */
export interface InviteAgreementRule {
  check(item: InviteAgreement): string[];
}

export class InviteAgreementCodeLengthRule implements InviteAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class InviteAgreementAllowedRegionRule implements InviteAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: InviteAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.region))) return [`region ${item.region} is duplicated`];
    return [];
  }
}

export class InviteAgreementRegionLengthRule implements InviteAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: InviteAgreement): string[] {
    const size = item.region.length;
    if (size > this.maxLength) return [`region is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a invite agreement. */
export class InviteAgreementValidator {
  rules: InviteAgreementRule[];

  constructor(rules: InviteAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: InviteAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: InviteAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: InviteAgreement[]): Map<string, string[]> {
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

export function defaultInviteAgreementValidator(): InviteAgreementValidator {
  return new InviteAgreementValidator(
    [
      new InviteAgreementCodeLengthRule(32),
      new InviteAgreementAllowedRegionRule(["scheduled", "strict"]),
      new InviteAgreementRegionLengthRule(120),
    ],
  );
}
