import { BatchedInviteSchedule } from "./batched-invite-schedule.js";

/** A rule a batched invite schedule must pass. Check returns its problems, or none. */
export interface BatchedInviteScheduleRule {
  check(item: BatchedInviteSchedule): string[];
}

export class BatchedInviteScheduleTimezoneLengthRule implements BatchedInviteScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInviteSchedule): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedInviteScheduleDiscountRangeRule implements BatchedInviteScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedInviteSchedule): string[] {
    const value = item.discount;
    if (value < this.min || value > this.max) return [`discount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedInviteScheduleTitleLengthRule implements BatchedInviteScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedInviteSchedule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched invite schedule. */
export class BatchedInviteScheduleValidator {
  rules: BatchedInviteScheduleRule[];

  constructor(rules: BatchedInviteScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedInviteSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedInviteSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedInviteSchedule[]): Map<string, string[]> {
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

export function defaultBatchedInviteScheduleValidator(): BatchedInviteScheduleValidator {
  return new BatchedInviteScheduleValidator(
    [
      new BatchedInviteScheduleTimezoneLengthRule(80),
      new BatchedInviteScheduleDiscountRangeRule(9.3, 218),
      new BatchedInviteScheduleTitleLengthRule(120),
    ],
  );
}
