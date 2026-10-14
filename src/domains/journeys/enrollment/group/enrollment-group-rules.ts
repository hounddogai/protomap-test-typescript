import { EnrollmentGroup } from "./enrollment-group.js";

/** A rule a enrollment group must pass. Check returns its problems, or none. */
export interface EnrollmentGroupRule {
  check(item: EnrollmentGroup): string[];
}

export class EnrollmentGroupReviewerLengthRule implements EnrollmentGroupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentGroup): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentGroupActiveGuardRule implements EnrollmentGroupRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EnrollmentGroup): string[] {
    if (item.active && item.frequencyCap > this.limit) return [`frequency cap ${item.frequencyCap} exceeds ${this.limit} while active`];
    return [];
  }
}

export class EnrollmentGroupFrequencyCapRangeRule implements EnrollmentGroupRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentGroup): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a enrollment group. */
export class EnrollmentGroupValidator {
  rules: EnrollmentGroupRule[];

  constructor(rules: EnrollmentGroupRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentGroup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentGroup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentGroup[]): Map<string, string[]> {
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

export function defaultEnrollmentGroupValidator(): EnrollmentGroupValidator {
  return new EnrollmentGroupValidator(
    [
      new EnrollmentGroupReviewerLengthRule(32),
      new EnrollmentGroupActiveGuardRule(64),
      new EnrollmentGroupFrequencyCapRangeRule(64, 1000),
    ],
  );
}
