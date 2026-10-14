import { EnrollmentPolicy } from "./enrollment-policy.js";

/** A rule a enrollment policy must pass. Check returns its problems, or none. */
export interface EnrollmentPolicyRule {
  check(item: EnrollmentPolicy): string[];
}

export class EnrollmentPolicyCodeLengthRule implements EnrollmentPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentPolicy): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentPolicySequenceRangeRule implements EnrollmentPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentPolicy): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentPolicyLabelLengthRule implements EnrollmentPolicyRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentPolicy): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentPolicyDiscountRangeRule implements EnrollmentPolicyRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentPolicy): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a enrollment policy. */
export class EnrollmentPolicyValidator {
  rules: EnrollmentPolicyRule[];

  constructor(rules: EnrollmentPolicyRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentPolicy): string[] {
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

  requireValid(item: EnrollmentPolicy): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentPolicy[]): Map<string, string[]> {
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

export function defaultEnrollmentPolicyValidator(): EnrollmentPolicyValidator {
  return new EnrollmentPolicyValidator(
    [
      new EnrollmentPolicyCodeLengthRule(80),
      new EnrollmentPolicySequenceRangeRule(16, 80),
      new EnrollmentPolicyLabelLengthRule(64),
      new EnrollmentPolicyDiscountRangeRule(2.1, 1481.2),
    ],
  );
}
