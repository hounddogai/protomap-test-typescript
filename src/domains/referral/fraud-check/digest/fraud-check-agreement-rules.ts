import { FraudCheckAgreement } from "./fraud-check-agreement.js";

/** A rule a fraud check agreement must pass. Check returns its problems, or none. */
export interface FraudCheckAgreementRule {
  check(item: FraudCheckAgreement): string[];
}

export class FraudCheckAgreementLabelLengthRule implements FraudCheckAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckAgreement): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckAgreementEndsAtRangeRule implements FraudCheckAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckAgreement): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FraudCheckAgreementRequiredLabelRule implements FraudCheckAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FraudCheckAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FraudCheckAgreementCategoryLengthRule implements FraudCheckAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FraudCheckAgreement): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FraudCheckAgreementGraceDaysRangeRule implements FraudCheckAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FraudCheckAgreement): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a fraud check agreement. */
export class FraudCheckAgreementValidator {
  rules: FraudCheckAgreementRule[];

  constructor(rules: FraudCheckAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: FraudCheckAgreement): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FraudCheckAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FraudCheckAgreement[]): Map<string, string[]> {
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

export function defaultFraudCheckAgreementValidator(): FraudCheckAgreementValidator {
  return new FraudCheckAgreementValidator(
    [
      new FraudCheckAgreementLabelLengthRule(80),
      new FraudCheckAgreementEndsAtRangeRule(32, 86400),
      new FraudCheckAgreementRequiredLabelRule("fraud check agreement needs a value"),
      new FraudCheckAgreementCategoryLengthRule(80),
      new FraudCheckAgreementGraceDaysRangeRule(80, 86400),
    ],
  );
}
