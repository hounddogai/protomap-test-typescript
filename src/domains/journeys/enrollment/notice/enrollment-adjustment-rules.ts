import { EnrollmentAdjustment } from "./enrollment-adjustment.js";

/** A rule a enrollment adjustment must pass. Check returns its problems, or none. */
export interface EnrollmentAdjustmentRule {
  check(item: EnrollmentAdjustment): string[];
}

export class EnrollmentAdjustmentFloorValueRangeRule implements EnrollmentAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentAdjustment): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class EnrollmentAdjustmentPhoneLengthRule implements EnrollmentAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentAdjustment): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentAdjustmentRevisionRangeRule implements EnrollmentAdjustmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentAdjustment): string[] {
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

export class EnrollmentAdjustmentTitleLengthRule implements EnrollmentAdjustmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentAdjustment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentAdjustmentRequiredCodeRule implements EnrollmentAdjustmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentAdjustment): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a enrollment adjustment. */
export class EnrollmentAdjustmentValidator {
  rules: EnrollmentAdjustmentRule[];

  constructor(rules: EnrollmentAdjustmentRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentAdjustment): string[] {
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

  requireValid(item: EnrollmentAdjustment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentAdjustment[]): Map<string, string[]> {
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

export function defaultEnrollmentAdjustmentValidator(): EnrollmentAdjustmentValidator {
  return new EnrollmentAdjustmentValidator(
    [
      new EnrollmentAdjustmentFloorValueRangeRule(9.1, 638.7),
      new EnrollmentAdjustmentPhoneLengthRule(120),
      new EnrollmentAdjustmentRevisionRangeRule(80, 255),
      new EnrollmentAdjustmentTitleLengthRule(16),
      new EnrollmentAdjustmentRequiredCodeRule("enrollment adjustment needs this field"),
    ],
  );
}
