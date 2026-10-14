import * as text from "../../../../kit/text.js";
import { CappedNudgeSchedule } from "./capped-nudge-schedule.js";

/** A rule a capped nudge schedule must pass. Check returns its problems, or none. */
export interface CappedNudgeScheduleRule {
  check(item: CappedNudgeSchedule): string[];
}

export class CappedNudgeScheduleRequiredOwnerIdRule implements CappedNudgeScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedNudgeSchedule): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class CappedNudgeScheduleOwnerIdLengthRule implements CappedNudgeScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedNudgeSchedule): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedNudgeScheduleRateRangeRule implements CappedNudgeScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedNudgeSchedule): string[] {
    const value = item.rate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class CappedNudgeScheduleAllowedOwnerIdRule implements CappedNudgeScheduleRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CappedNudgeSchedule): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.ownerId))) return [`owner id ${item.ownerId} is too long`];
    return [];
  }
}

export class CappedNudgeScheduleTitleLengthRule implements CappedNudgeScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedNudgeSchedule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped nudge schedule. */
export class CappedNudgeScheduleValidator {
  rules: CappedNudgeScheduleRule[];

  constructor(rules: CappedNudgeScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedNudgeSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedNudgeSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedNudgeSchedule[]): Map<string, string[]> {
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

export function defaultCappedNudgeScheduleValidator(): CappedNudgeScheduleValidator {
  return new CappedNudgeScheduleValidator(
    [
      new CappedNudgeScheduleRequiredOwnerIdRule("capped nudge schedule needs an entry"),
      new CappedNudgeScheduleOwnerIdLengthRule(32),
      new CappedNudgeScheduleRateRangeRule(3.1, 3615.2),
      new CappedNudgeScheduleAllowedOwnerIdRule([]),
      new CappedNudgeScheduleTitleLengthRule(80),
    ],
  );
}
