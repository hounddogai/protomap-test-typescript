import { EnrollmentTarget } from "./enrollment-target.js";

/** A rule a enrollment target must pass. Check returns its problems, or none. */
export interface EnrollmentTargetRule {
  check(item: EnrollmentTarget): string[];
}

export class EnrollmentTargetCapacityRangeRule implements EnrollmentTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentTarget): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentTargetFrequencyCapRangeRule implements EnrollmentTargetRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentTarget): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentTargetChecksumLengthRule implements EnrollmentTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentTarget): string[] {
    const size = item.checksum.length;
    if (size > this.maxLength) return [`checksum is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentTargetNameLengthRule implements EnrollmentTargetRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentTarget): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment target. */
export class EnrollmentTargetValidator {
  rules: EnrollmentTargetRule[];

  constructor(rules: EnrollmentTargetRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentTarget): string[] {
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

  requireValid(item: EnrollmentTarget): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentTarget[]): Map<string, string[]> {
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

export function defaultEnrollmentTargetValidator(): EnrollmentTargetValidator {
  return new EnrollmentTargetValidator(
    [
      new EnrollmentTargetCapacityRangeRule(255, 3600),
      new EnrollmentTargetFrequencyCapRangeRule(16, 255),
      new EnrollmentTargetChecksumLengthRule(1000),
      new EnrollmentTargetNameLengthRule(80),
    ],
  );
}
