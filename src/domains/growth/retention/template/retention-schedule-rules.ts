import * as text from "../../../../kit/text.js";
import { RetentionSchedule } from "./retention-schedule.js";

/** A rule a retention schedule must pass. Check returns its problems, or none. */
export interface RetentionScheduleRule {
  check(item: RetentionSchedule): string[];
}

export class RetentionScheduleAllowedLocaleRule implements RetentionScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RetentionSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is unknown`];
    return [];
  }
}

export class RetentionScheduleRequiredCodeRule implements RetentionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionScheduleRequiredLabelRule implements RetentionScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RetentionSchedule): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class RetentionScheduleExpiresAtRangeRule implements RetentionScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RetentionSchedule): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a retention schedule. */
export class RetentionScheduleValidator {
  rules: RetentionScheduleRule[];

  constructor(rules: RetentionScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: RetentionSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RetentionSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RetentionSchedule[]): Map<string, string[]> {
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

export function defaultRetentionScheduleValidator(): RetentionScheduleValidator {
  return new RetentionScheduleValidator(
    [
      new RetentionScheduleAllowedLocaleRule(["weighted", "primary"]),
      new RetentionScheduleRequiredCodeRule("retention schedule needs a value"),
      new RetentionScheduleRequiredLabelRule("retention schedule needs this field"),
      new RetentionScheduleExpiresAtRangeRule(64, 120),
    ],
  );
}
