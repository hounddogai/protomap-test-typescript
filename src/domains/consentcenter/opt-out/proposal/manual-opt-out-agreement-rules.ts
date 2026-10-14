import { ManualOptOutAgreement } from "./manual-opt-out-agreement.js";

/** A rule a manual opt out agreement must pass. Check returns its problems, or none. */
export interface ManualOptOutAgreementRule {
  check(item: ManualOptOutAgreement): string[];
}

export class ManualOptOutAgreementRequiredSummaryRule implements ManualOptOutAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualOptOutAgreement): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class ManualOptOutAgreementCapacityRangeRule implements ManualOptOutAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualOptOutAgreement): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ManualOptOutAgreementCodeLengthRule implements ManualOptOutAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualOptOutAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualOptOutAgreementRequiredLabelRule implements ManualOptOutAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualOptOutAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual opt out agreement. */
export class ManualOptOutAgreementValidator {
  rules: ManualOptOutAgreementRule[];

  constructor(rules: ManualOptOutAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: ManualOptOutAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualOptOutAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualOptOutAgreement[]): Map<string, string[]> {
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

export function defaultManualOptOutAgreementValidator(): ManualOptOutAgreementValidator {
  return new ManualOptOutAgreementValidator(
    [
      new ManualOptOutAgreementRequiredSummaryRule("manual opt out agreement needs this field"),
      new ManualOptOutAgreementCapacityRangeRule(255, 86400),
      new ManualOptOutAgreementCodeLengthRule(255),
      new ManualOptOutAgreementRequiredLabelRule("manual opt out agreement needs a value"),
    ],
  );
}
