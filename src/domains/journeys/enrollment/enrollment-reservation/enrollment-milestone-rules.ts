import { EnrollmentMilestone } from "./enrollment-milestone.js";

/** A rule a enrollment milestone must pass. Check returns its problems, or none. */
export interface EnrollmentMilestoneRule {
  check(item: EnrollmentMilestone): string[];
}

export class EnrollmentMilestoneRequiredLabelRule implements EnrollmentMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentMilestone): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentMilestoneLabelLengthRule implements EnrollmentMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentMilestone): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EnrollmentMilestoneUpdatedAtRangeRule implements EnrollmentMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentMilestone): string[] {
    const value = item.updatedAt;
    if (value < this.min || value > this.max) return [`updated at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a enrollment milestone. */
export class EnrollmentMilestoneValidator {
  rules: EnrollmentMilestoneRule[];

  constructor(rules: EnrollmentMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentMilestone[]): Map<string, string[]> {
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

export function defaultEnrollmentMilestoneValidator(): EnrollmentMilestoneValidator {
  return new EnrollmentMilestoneValidator(
    [
      new EnrollmentMilestoneRequiredLabelRule("enrollment milestone needs an entry"),
      new EnrollmentMilestoneLabelLengthRule(16),
      new EnrollmentMilestoneUpdatedAtRangeRule(16, 64),
    ],
  );
}
