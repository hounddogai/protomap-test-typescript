import { PrimarySenderAgreement } from "./primary-sender-agreement.js";

/** A rule a primary sender agreement must pass. Check returns its problems, or none. */
export interface PrimarySenderAgreementRule {
  check(item: PrimarySenderAgreement): string[];
}

export class PrimarySenderAgreementPriorityRangeRule implements PrimarySenderAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimarySenderAgreement): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimarySenderAgreementNameLengthRule implements PrimarySenderAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySenderAgreement): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySenderAgreementLabelLengthRule implements PrimarySenderAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySenderAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary sender agreement. */
export class PrimarySenderAgreementValidator {
  rules: PrimarySenderAgreementRule[];

  constructor(rules: PrimarySenderAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySenderAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimarySenderAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySenderAgreement[]): Map<string, string[]> {
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

export function defaultPrimarySenderAgreementValidator(): PrimarySenderAgreementValidator {
  return new PrimarySenderAgreementValidator(
    [
      new PrimarySenderAgreementPriorityRangeRule(32, 3600),
      new PrimarySenderAgreementNameLengthRule(32),
      new PrimarySenderAgreementLabelLengthRule(32),
    ],
  );
}
