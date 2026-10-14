import * as text from "../../../../kit/text.js";
import { EnrollmentSchedule } from "./enrollment-schedule.js";

/** A rule a enrollment schedule must pass. Check returns its problems, or none. */
export interface EnrollmentScheduleRule {
  check(item: EnrollmentSchedule): string[];
}

export class EnrollmentScheduleRequiredCodeRule implements EnrollmentScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentScheduleAllowedSegmentRule implements EnrollmentScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: EnrollmentSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.segment))) return [`segment ${item.segment} is blocked`];
    return [];
  }
}

export class EnrollmentScheduleRequiredNameRule implements EnrollmentScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EnrollmentSchedule): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class EnrollmentScheduleSegmentLengthRule implements EnrollmentScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EnrollmentSchedule): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a enrollment schedule. */
export class EnrollmentScheduleValidator {
  rules: EnrollmentScheduleRule[];

  constructor(rules: EnrollmentScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentSchedule): string[] {
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

  requireValid(item: EnrollmentSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentSchedule[]): Map<string, string[]> {
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

export function defaultEnrollmentScheduleValidator(): EnrollmentScheduleValidator {
  return new EnrollmentScheduleValidator(
    [
      new EnrollmentScheduleRequiredCodeRule("enrollment schedule needs an entry"),
      new EnrollmentScheduleAllowedSegmentRule([]),
      new EnrollmentScheduleRequiredNameRule("enrollment schedule needs this field"),
      new EnrollmentScheduleSegmentLengthRule(1000),
    ],
  );
}
