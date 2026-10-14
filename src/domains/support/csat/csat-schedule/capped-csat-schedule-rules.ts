import { CappedCsatSchedule } from "./capped-csat-schedule.js";

/** A rule a capped csat schedule must pass. Check returns its problems, or none. */
export interface CappedCsatScheduleRule {
  check(item: CappedCsatSchedule): string[];
}

export class CappedCsatScheduleRequiredChecksumRule implements CappedCsatScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCsatSchedule): string[] {
    if (item.checksum.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCsatScheduleRequiredExternalRefRule implements CappedCsatScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCsatSchedule): string[] {
    if (item.externalRef.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCsatSchedulePriorityRangeRule implements CappedCsatScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCsatSchedule): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedCsatScheduleStartsAtRangeRule implements CappedCsatScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCsatSchedule): string[] {
    const value = item.startsAt;
    if (value < this.min || value > this.max) return [`starts at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedCsatScheduleAttemptsRangeRule implements CappedCsatScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: CappedCsatSchedule): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class CappedCsatScheduleExternalRefLengthRule implements CappedCsatScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCsatSchedule): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a capped csat schedule. */
export class CappedCsatScheduleValidator {
  rules: CappedCsatScheduleRule[];

  constructor(rules: CappedCsatScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCsatSchedule): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: CappedCsatSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCsatSchedule[]): Map<string, string[]> {
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

export function defaultCappedCsatScheduleValidator(): CappedCsatScheduleValidator {
  return new CappedCsatScheduleValidator(
    [
      new CappedCsatScheduleRequiredChecksumRule("capped csat schedule needs this field"),
      new CappedCsatScheduleRequiredExternalRefRule("capped csat schedule needs a value"),
      new CappedCsatSchedulePriorityRangeRule(16, 64),
      new CappedCsatScheduleStartsAtRangeRule(80, 3600),
      new CappedCsatScheduleAttemptsRangeRule(86400, 86400),
      new CappedCsatScheduleExternalRefLengthRule(255),
    ],
  );
}
