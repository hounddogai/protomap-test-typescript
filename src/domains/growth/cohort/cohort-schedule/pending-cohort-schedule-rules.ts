import { PendingCohortSchedule } from "./pending-cohort-schedule.js";

/** A rule a pending cohort schedule must pass. Check returns its problems, or none. */
export interface PendingCohortScheduleRule {
  check(item: PendingCohortSchedule): string[];
}

export class PendingCohortScheduleCreatedAtRangeRule implements PendingCohortScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCohortSchedule): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingCohortScheduleMarginRangeRule implements PendingCohortScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingCohortSchedule): string[] {
    const value = item.margin;
    if (value < this.min || value > this.max) return [`margin ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingCohortScheduleLabelLengthRule implements PendingCohortScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingCohortSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending cohort schedule. */
export class PendingCohortScheduleValidator {
  rules: PendingCohortScheduleRule[];

  constructor(rules: PendingCohortScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: PendingCohortSchedule): string[] {
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

  requireValid(item: PendingCohortSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingCohortSchedule[]): Map<string, string[]> {
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

export function defaultPendingCohortScheduleValidator(): PendingCohortScheduleValidator {
  return new PendingCohortScheduleValidator(
    [
      new PendingCohortScheduleCreatedAtRangeRule(16, 80),
      new PendingCohortScheduleMarginRangeRule(4, 4594.3),
      new PendingCohortScheduleLabelLengthRule(120),
    ],
  );
}
