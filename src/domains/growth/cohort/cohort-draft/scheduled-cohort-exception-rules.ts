import { ScheduledCohortException } from "./scheduled-cohort-exception.js";

/** A rule a scheduled cohort exception must pass. Check returns its problems, or none. */
export interface ScheduledCohortExceptionRule {
  check(item: ScheduledCohortException): string[];
}

export class ScheduledCohortExceptionActiveGuardRule implements ScheduledCohortExceptionRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ScheduledCohortException): string[] {
    if (item.active && item.rate > this.limit) return [`rate ${item.rate} exceeds ${this.limit} while active`];
    return [];
  }
}

export class ScheduledCohortExceptionRequiredDescriptionRule implements ScheduledCohortExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCohortException): string[] {
    if (item.description.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledCohortExceptionEndsAtRangeRule implements ScheduledCohortExceptionRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledCohortException): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ScheduledCohortExceptionRequiredCodeRule implements ScheduledCohortExceptionRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledCohortException): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a scheduled cohort exception. */
export class ScheduledCohortExceptionValidator {
  rules: ScheduledCohortExceptionRule[];

  constructor(rules: ScheduledCohortExceptionRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledCohortException): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledCohortException): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledCohortException[]): Map<string, string[]> {
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

export function defaultScheduledCohortExceptionValidator(): ScheduledCohortExceptionValidator {
  return new ScheduledCohortExceptionValidator(
    [
      new ScheduledCohortExceptionActiveGuardRule(6.7),
      new ScheduledCohortExceptionRequiredDescriptionRule("scheduled cohort exception needs this field"),
      new ScheduledCohortExceptionEndsAtRangeRule(255, 86400),
      new ScheduledCohortExceptionRequiredCodeRule("scheduled cohort exception needs a value"),
    ],
  );
}
