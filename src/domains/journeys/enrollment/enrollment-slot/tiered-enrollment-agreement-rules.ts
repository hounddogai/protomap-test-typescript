import { TieredEnrollmentAgreement } from "./tiered-enrollment-agreement.js";

/** A rule a tiered enrollment agreement must pass. Check returns its problems, or none. */
export interface TieredEnrollmentAgreementRule {
  check(item: TieredEnrollmentAgreement): string[];
}

export class TieredEnrollmentAgreementCreatedAtRangeRule implements TieredEnrollmentAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredEnrollmentAgreement): string[] {
    const value = item.createdAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`created at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`created at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredEnrollmentAgreementCodeLengthRule implements TieredEnrollmentAgreementRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredEnrollmentAgreement): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredEnrollmentAgreementRequiredLabelRule implements TieredEnrollmentAgreementRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEnrollmentAgreement): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class TieredEnrollmentAgreementExpiresAtRangeRule implements TieredEnrollmentAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredEnrollmentAgreement): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredEnrollmentAgreementLimitRangeRule implements TieredEnrollmentAgreementRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredEnrollmentAgreement): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a tiered enrollment agreement. */
export class TieredEnrollmentAgreementValidator {
  rules: TieredEnrollmentAgreementRule[];

  constructor(rules: TieredEnrollmentAgreementRule[]) {
    this.rules = rules;
  }

  validate(item: TieredEnrollmentAgreement): string[] {
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

  requireValid(item: TieredEnrollmentAgreement): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredEnrollmentAgreement[]): Map<string, string[]> {
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

export function defaultTieredEnrollmentAgreementValidator(): TieredEnrollmentAgreementValidator {
  return new TieredEnrollmentAgreementValidator(
    [
      new TieredEnrollmentAgreementCreatedAtRangeRule(1000, 1000),
      new TieredEnrollmentAgreementCodeLengthRule(120),
      new TieredEnrollmentAgreementRequiredLabelRule("tiered enrollment agreement needs this field"),
      new TieredEnrollmentAgreementExpiresAtRangeRule(80, 80),
      new TieredEnrollmentAgreementLimitRangeRule(64, 1000),
    ],
  );
}
