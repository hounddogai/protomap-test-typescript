import { RollingJourneyAssignment } from "./rolling-journey-assignment.js";

/** A rule a rolling journey assignment must pass. Check returns its problems, or none. */
export interface RollingJourneyAssignmentRule {
  check(item: RollingJourneyAssignment): string[];
}

export class RollingJourneyAssignmentTitleLengthRule implements RollingJourneyAssignmentRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingJourneyAssignment): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingJourneyAssignmentMaximumRangeRule implements RollingJourneyAssignmentRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingJourneyAssignment): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingJourneyAssignmentRequiredDescriptionRule implements RollingJourneyAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingJourneyAssignment): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling journey assignment. */
export class RollingJourneyAssignmentValidator {
  rules: RollingJourneyAssignmentRule[];

  constructor(rules: RollingJourneyAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: RollingJourneyAssignment): string[] {
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

  requireValid(item: RollingJourneyAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingJourneyAssignment[]): Map<string, string[]> {
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

export function defaultRollingJourneyAssignmentValidator(): RollingJourneyAssignmentValidator {
  return new RollingJourneyAssignmentValidator(
    [
      new RollingJourneyAssignmentTitleLengthRule(1000),
      new RollingJourneyAssignmentMaximumRangeRule(4, 458.7),
      new RollingJourneyAssignmentRequiredDescriptionRule("rolling journey assignment needs this field"),
    ],
  );
}
