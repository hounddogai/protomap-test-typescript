import { LenientEnrollmentMilestone } from "./lenient-enrollment-milestone.js";

/** A rule a lenient enrollment milestone must pass. Check returns its problems, or none. */
export interface LenientEnrollmentMilestoneRule {
  check(item: LenientEnrollmentMilestone): string[];
}

export class LenientEnrollmentMilestoneAmountRangeRule implements LenientEnrollmentMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientEnrollmentMilestone): string[] {
    const value = item.amount;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`amount ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`amount ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientEnrollmentMilestoneRequiredCodeRule implements LenientEnrollmentMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientEnrollmentMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientEnrollmentMilestoneCountryLengthRule implements LenientEnrollmentMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientEnrollmentMilestone): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientEnrollmentMilestoneRequiredCountryRule implements LenientEnrollmentMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientEnrollmentMilestone): string[] {
    if (item.country.trim() === "") return [this.message];
    return [];
  }
}

export class LenientEnrollmentMilestoneCodeLengthRule implements LenientEnrollmentMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientEnrollmentMilestone): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientEnrollmentMilestoneSequenceRangeRule implements LenientEnrollmentMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientEnrollmentMilestone): string[] {
    const value = item.sequence;
    if (value < this.min || value > this.max) return [`sequence ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient enrollment milestone. */
export class LenientEnrollmentMilestoneValidator {
  rules: LenientEnrollmentMilestoneRule[];

  constructor(rules: LenientEnrollmentMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: LenientEnrollmentMilestone): string[] {
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

  requireValid(item: LenientEnrollmentMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientEnrollmentMilestone[]): Map<string, string[]> {
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

export function defaultLenientEnrollmentMilestoneValidator(): LenientEnrollmentMilestoneValidator {
  return new LenientEnrollmentMilestoneValidator(
    [
      new LenientEnrollmentMilestoneAmountRangeRule(7.2, 3503.7),
      new LenientEnrollmentMilestoneRequiredCodeRule("lenient enrollment milestone needs this field"),
      new LenientEnrollmentMilestoneCountryLengthRule(32),
      new LenientEnrollmentMilestoneRequiredCountryRule("lenient enrollment milestone needs an entry"),
      new LenientEnrollmentMilestoneCodeLengthRule(80),
      new LenientEnrollmentMilestoneSequenceRangeRule(16, 3600),
    ],
  );
}
