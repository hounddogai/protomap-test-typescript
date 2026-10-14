import * as text from "../../../../kit/text.js";
import { ApprovalAgreement } from "./approval-agreement.js";

/** A rule a approval agreement must pass. Check returns its problems, or none. */
export interface ApprovalAgreementRule {
  check(item: ApprovalAgreement): string[];
}

export class ApprovalAgreementCodeLengthRule implements ApprovalAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalAgreementRequiredSegmentRule implements ApprovalAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ApprovalAgreement): string[] {
    if (item.segment.trim() === "") return [this.message];
    return [];
  }
}

export class ApprovalAgreementRatioRangeRule implements ApprovalAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ApprovalAgreement): string[] {
    const value = item.ratio;
    if (value < this.min || value > this.max) return [`ratio ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ApprovalAgreementTitleLengthRule implements ApprovalAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalAgreementSegmentLengthRule implements ApprovalAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ApprovalAgreement): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ApprovalAgreementAllowedCodeRule implements ApprovalAgreementRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ApprovalAgreement): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is unknown`];
    return [];
  }
}

/** Runs every rule of a approval agreement. */
export class ApprovalAgreementValidator {
  rules: ApprovalAgreementRule[];

  constructor(rules: ApprovalAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ApprovalAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ApprovalAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ApprovalAgreement[]): Map<string, string[]> {
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

export function defaultApprovalAgreementValidator(): ApprovalAgreementValidator {
  return new ApprovalAgreementValidator(
    [
      new ApprovalAgreementCodeLengthRule(32),
      new ApprovalAgreementRequiredSegmentRule("approval agreement needs this field"),
      new ApprovalAgreementRatioRangeRule(0.8, 4327.1),
      new ApprovalAgreementTitleLengthRule(1000),
      new ApprovalAgreementSegmentLengthRule(32),
      new ApprovalAgreementAllowedCodeRule(["pending", "legacy"]),
    ],
  );
}
