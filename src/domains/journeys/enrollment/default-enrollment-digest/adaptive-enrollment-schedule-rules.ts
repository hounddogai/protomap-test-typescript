import { AdaptiveEnrollmentSchedule } from "./adaptive-enrollment-schedule.js";

/** A rule a adaptive enrollment schedule must pass. Check returns its problems, or none. */
export interface AdaptiveEnrollmentScheduleRule {
  check(item: AdaptiveEnrollmentSchedule): string[];
}

export class AdaptiveEnrollmentScheduleActiveGuardRule implements AdaptiveEnrollmentScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: AdaptiveEnrollmentSchedule): string[] {
    if (item.active && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while active`];
    return [];
  }
}

export class AdaptiveEnrollmentScheduleRequiredUtmSourceRule implements AdaptiveEnrollmentScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveEnrollmentSchedule): string[] {
    if (item.utmSource.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveEnrollmentScheduleBatchSizeRangeRule implements AdaptiveEnrollmentScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveEnrollmentSchedule): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveEnrollmentScheduleNameLengthRule implements AdaptiveEnrollmentScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveEnrollmentSchedule): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive enrollment schedule. */
export class AdaptiveEnrollmentScheduleValidator {
  rules: AdaptiveEnrollmentScheduleRule[];

  constructor(rules: AdaptiveEnrollmentScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveEnrollmentSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveEnrollmentSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveEnrollmentSchedule[]): Map<string, string[]> {
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

export function defaultAdaptiveEnrollmentScheduleValidator(): AdaptiveEnrollmentScheduleValidator {
  return new AdaptiveEnrollmentScheduleValidator(
    [
      new AdaptiveEnrollmentScheduleActiveGuardRule(120),
      new AdaptiveEnrollmentScheduleRequiredUtmSourceRule("adaptive enrollment schedule needs this field"),
      new AdaptiveEnrollmentScheduleBatchSizeRangeRule(32, 86400),
      new AdaptiveEnrollmentScheduleNameLengthRule(3600),
    ],
  );
}
