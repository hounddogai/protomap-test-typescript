import { ScheduledCohortSchedule } from "./scheduled-cohort-schedule.js";

/** A rule a scheduled cohort schedule must pass. Check returns its problems, or none. */
export interface ScheduledCohortScheduleRule {
  check(item: ScheduledCohortSchedule): string[];
}

export class ScheduledCohortScheduleQuantityRangeRule implements ScheduledCohortScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCohortSchedule): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledCohortScheduleRequiredUnitRule implements ScheduledCohortScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCohortSchedule): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledCohortScheduleRequiredOwnerIdRule implements ScheduledCohortScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCohortSchedule): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled cohort schedule. */
export class ScheduledCohortScheduleValidator {
  rules: ScheduledCohortScheduleRule[];

  constructor(rules: ScheduledCohortScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCohortSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledCohortSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCohortSchedule[]): Map<string, string[]> {
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

export function defaultScheduledCohortScheduleValidator(): ScheduledCohortScheduleValidator {
  return new ScheduledCohortScheduleValidator(
    [
      new ScheduledCohortScheduleQuantityRangeRule(16, 3600),
      new ScheduledCohortScheduleRequiredUnitRule("scheduled cohort schedule needs a value"),
      new ScheduledCohortScheduleRequiredOwnerIdRule("scheduled cohort schedule needs a value"),
    ],
  );
}
