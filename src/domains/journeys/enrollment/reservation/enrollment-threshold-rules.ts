import { EnrollmentThreshold } from "./enrollment-threshold.js";

/** A rule a enrollment threshold must pass. Check returns its problems, or none. */
export interface EnrollmentThresholdRule {
  check(item: EnrollmentThreshold): string[];
}

export class EnrollmentThresholdRequiredCodeRule implements EnrollmentThresholdRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentThreshold): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentThresholdCapacityRangeRule implements EnrollmentThresholdRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentThreshold): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentThresholdNameLengthRule implements EnrollmentThresholdRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentThreshold): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment threshold. */
export class EnrollmentThresholdValidator {
  rules: EnrollmentThresholdRule[];

  constructor(rules: EnrollmentThresholdRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentThreshold): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentThreshold): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentThreshold[]): Map<string, string[]> {
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

export function defaultEnrollmentThresholdValidator(): EnrollmentThresholdValidator {
  return new EnrollmentThresholdValidator(
    [
      new EnrollmentThresholdRequiredCodeRule("enrollment threshold needs an entry"),
      new EnrollmentThresholdCapacityRangeRule(32, 3600),
      new EnrollmentThresholdNameLengthRule(16),
    ],
  );
}
