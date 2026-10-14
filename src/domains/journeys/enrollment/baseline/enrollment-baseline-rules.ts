import { EnrollmentBaseline } from "./enrollment-baseline.js";

/** A rule a enrollment baseline must pass. Check returns its problems, or none. */
export interface EnrollmentBaselineRule {
  check(item: EnrollmentBaseline): string[];
}

export class EnrollmentBaselineRequiredTitleRule implements EnrollmentBaselineRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentBaseline): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentBaselineSendAtRangeRule implements EnrollmentBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentBaseline): string[] {
    const value = item.sendAt;
    if (value < this.min || value > this.max) return [`send at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentBaselineQuantityRangeRule implements EnrollmentBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentBaseline): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentBaselineTitleLengthRule implements EnrollmentBaselineRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentBaseline): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentBaselineThresholdRangeRule implements EnrollmentBaselineRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentBaseline): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a enrollment baseline. */
export class EnrollmentBaselineValidator {
  rules: EnrollmentBaselineRule[];

  constructor(rules: EnrollmentBaselineRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentBaseline): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentBaseline): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentBaseline[]): Map<string, string[]> {
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

export function defaultEnrollmentBaselineValidator(): EnrollmentBaselineValidator {
  return new EnrollmentBaselineValidator(
    [
      new EnrollmentBaselineRequiredTitleRule("enrollment baseline needs an entry"),
      new EnrollmentBaselineSendAtRangeRule(64, 120),
      new EnrollmentBaselineQuantityRangeRule(120, 3600),
      new EnrollmentBaselineTitleLengthRule(1000),
      new EnrollmentBaselineThresholdRangeRule(6.5, 4847.2),
    ],
  );
}
