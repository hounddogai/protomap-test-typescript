import { RegionalApprovalAgreement } from "./regional-approval-agreement.js";

/** A rule a regional approval agreement must pass. Check returns its problems, or none. */
export interface RegionalApprovalAgreementRule {
  check(item: RegionalApprovalAgreement): string[];
}

export class RegionalApprovalAgreementSequenceRangeRule implements RegionalApprovalAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalApprovalAgreement): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RegionalApprovalAgreementExternalRefLengthRule implements RegionalApprovalAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalApprovalAgreement): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalApprovalAgreementRequiredExternalRefRule implements RegionalApprovalAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalApprovalAgreement): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class RegionalApprovalAgreementRequiredLabelRule implements RegionalApprovalAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RegionalApprovalAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a regional approval agreement. */
export class RegionalApprovalAgreementValidator {
  rules: RegionalApprovalAgreementRule[];

  constructor(rules: RegionalApprovalAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalApprovalAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalApprovalAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalApprovalAgreement[]): Map<string, string[]> {
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

export function defaultRegionalApprovalAgreementValidator(): RegionalApprovalAgreementValidator {
  return new RegionalApprovalAgreementValidator(
    [
      new RegionalApprovalAgreementSequenceRangeRule(64, 120),
      new RegionalApprovalAgreementExternalRefLengthRule(3600),
      new RegionalApprovalAgreementRequiredExternalRefRule("regional approval agreement needs an entry"),
      new RegionalApprovalAgreementRequiredLabelRule("regional approval agreement needs this field"),
    ],
  );
}
