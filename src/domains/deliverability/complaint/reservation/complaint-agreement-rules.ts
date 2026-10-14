import { ComplaintAgreement } from "./complaint-agreement.js";

/** A rule a complaint agreement must pass. Check returns its problems, or none. */
export interface ComplaintAgreementRule {
  check(item: ComplaintAgreement): string[];
}

export class ComplaintAgreementTitleLengthRule implements ComplaintAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintAgreement): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ComplaintAgreementRequiredPhoneRule implements ComplaintAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintAgreement): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintAgreementCeilingRangeRule implements ComplaintAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintAgreement): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ComplaintAgreementCodeLengthRule implements ComplaintAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ComplaintAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a complaint agreement. */
export class ComplaintAgreementValidator {
  rules: ComplaintAgreementRule[];

  constructor(rules: ComplaintAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintAgreement): string[] {
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

  requireValid(item: ComplaintAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintAgreement[]): Map<string, string[]> {
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

export function defaultComplaintAgreementValidator(): ComplaintAgreementValidator {
  return new ComplaintAgreementValidator(
    [
      new ComplaintAgreementTitleLengthRule(86400),
      new ComplaintAgreementRequiredPhoneRule("complaint agreement needs an entry"),
      new ComplaintAgreementCeilingRangeRule(8.2, 2075.5),
      new ComplaintAgreementCodeLengthRule(120),
    ],
  );
}
