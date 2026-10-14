import { EnrollmentSegment } from "./enrollment-segment.js";

/** A rule a enrollment segment must pass. Check returns its problems, or none. */
export interface EnrollmentSegmentRule {
  check(item: EnrollmentSegment): string[];
}

export class EnrollmentSegmentRequiredUnitRule implements EnrollmentSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentSegment): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentSegmentCodeLengthRule implements EnrollmentSegmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentSegment): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentSegmentRequiredCodeRule implements EnrollmentSegmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentSegment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentSegmentThresholdRangeRule implements EnrollmentSegmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentSegment): string[] {
    const value = item.threshold;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`threshold ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`threshold ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a enrollment segment. */
export class EnrollmentSegmentValidator {
  rules: EnrollmentSegmentRule[];

  constructor(rules: EnrollmentSegmentRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentSegment): string[] {
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

  requireValid(item: EnrollmentSegment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentSegment[]): Map<string, string[]> {
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

export function defaultEnrollmentSegmentValidator(): EnrollmentSegmentValidator {
  return new EnrollmentSegmentValidator(
    [
      new EnrollmentSegmentRequiredUnitRule("enrollment segment needs a value"),
      new EnrollmentSegmentCodeLengthRule(16),
      new EnrollmentSegmentRequiredCodeRule("enrollment segment needs an entry"),
      new EnrollmentSegmentThresholdRangeRule(8.5, 2882.9),
    ],
  );
}
