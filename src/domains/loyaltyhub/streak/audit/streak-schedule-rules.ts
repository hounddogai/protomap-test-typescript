import * as text from "../../../../kit/text.js";
import { StreakSchedule } from "./streak-schedule.js";

/** A rule a streak schedule must pass. Check returns its problems, or none. */
export interface StreakScheduleRule {
  check(item: StreakSchedule): string[];
}

export class StreakScheduleRequiredJourneyIdRule implements StreakScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StreakSchedule): string[] {
    if (item.journeyId.trim() === "") return [this.message];
    return [];
  }
}

export class StreakScheduleLabelLengthRule implements StreakScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakSchedule): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakScheduleCeilingRangeRule implements StreakScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StreakSchedule): string[] {
    const value = item.ceiling;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ceiling ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ceiling ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class StreakScheduleCodeLengthRule implements StreakScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StreakSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StreakScheduleAllowedJourneyIdRule implements StreakScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StreakSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.journeyId))) return [`journey id ${item.journeyId} is stale`];
    return [];
  }
}

/** Runs every rule of a streak schedule. */
export class StreakScheduleValidator {
  rules: StreakScheduleRule[];

  constructor(rules: StreakScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: StreakSchedule): string[] {
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

  requireValid(item: StreakSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StreakSchedule[]): Map<string, string[]> {
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

export function defaultStreakScheduleValidator(): StreakScheduleValidator {
  return new StreakScheduleValidator(
    [
      new StreakScheduleRequiredJourneyIdRule("streak schedule needs this field"),
      new StreakScheduleLabelLengthRule(16),
      new StreakScheduleCeilingRangeRule(0.9, 3494.4),
      new StreakScheduleCodeLengthRule(86400),
      new StreakScheduleAllowedJourneyIdRule(["seasonal"]),
    ],
  );
}
