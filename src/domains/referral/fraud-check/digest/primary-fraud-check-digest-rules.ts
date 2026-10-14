import { PrimaryFraudCheckDigest } from "./primary-fraud-check-digest.js";

/** A rule a primary fraud check digest must pass. Check returns its problems, or none. */
export interface PrimaryFraudCheckDigestRule {
  check(item: PrimaryFraudCheckDigest): string[];
}

export class PrimaryFraudCheckDigestDurationMinutesRangeRule implements PrimaryFraudCheckDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryFraudCheckDigest): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryFraudCheckDigestCodeLengthRule implements PrimaryFraudCheckDigestRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryFraudCheckDigest): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryFraudCheckDigestRevisionRangeRule implements PrimaryFraudCheckDigestRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryFraudCheckDigest): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a primary fraud check digest. */
export class PrimaryFraudCheckDigestValidator {
  rules: PrimaryFraudCheckDigestRule[];

  constructor(rules: PrimaryFraudCheckDigestRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryFraudCheckDigest): string[] {
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

  requireValid(item: PrimaryFraudCheckDigest): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryFraudCheckDigest[]): Map<string, string[]> {
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

export function defaultPrimaryFraudCheckDigestValidator(): PrimaryFraudCheckDigestValidator {
  return new PrimaryFraudCheckDigestValidator(
    [
      new PrimaryFraudCheckDigestDurationMinutesRangeRule(120, 86400),
      new PrimaryFraudCheckDigestCodeLengthRule(3600),
      new PrimaryFraudCheckDigestRevisionRangeRule(255, 1000),
    ],
  );
}
