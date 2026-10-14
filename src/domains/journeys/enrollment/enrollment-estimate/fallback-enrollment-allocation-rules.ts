import { FallbackEnrollmentAllocation } from "./fallback-enrollment-allocation.js";

/** A rule a fallback enrollment allocation must pass. Check returns its problems, or none. */
export interface FallbackEnrollmentAllocationRule {
  check(item: FallbackEnrollmentAllocation): string[];
}

export class FallbackEnrollmentAllocationRequiredLabelRule implements FallbackEnrollmentAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackEnrollmentAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackEnrollmentAllocationRequiredCountryRule implements FallbackEnrollmentAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackEnrollmentAllocation): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class FallbackEnrollmentAllocationLabelLengthRule implements FallbackEnrollmentAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackEnrollmentAllocation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackEnrollmentAllocationVersionRangeRule implements FallbackEnrollmentAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackEnrollmentAllocation): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a fallback enrollment allocation. */
export class FallbackEnrollmentAllocationValidator {
  rules: FallbackEnrollmentAllocationRule[];

  constructor(rules: FallbackEnrollmentAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackEnrollmentAllocation): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FallbackEnrollmentAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackEnrollmentAllocation[]): Map<string, string[]> {
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

export function defaultFallbackEnrollmentAllocationValidator(): FallbackEnrollmentAllocationValidator {
  return new FallbackEnrollmentAllocationValidator(
    [
      new FallbackEnrollmentAllocationRequiredLabelRule("fallback enrollment allocation needs an entry"),
      new FallbackEnrollmentAllocationRequiredCountryRule("fallback enrollment allocation needs this field"),
      new FallbackEnrollmentAllocationLabelLengthRule(64),
      new FallbackEnrollmentAllocationVersionRangeRule(80, 1000),
    ],
  );
}
