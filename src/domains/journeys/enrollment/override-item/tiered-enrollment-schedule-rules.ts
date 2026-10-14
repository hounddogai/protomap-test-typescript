import { TieredEnrollmentSchedule } from "./tiered-enrollment-schedule.js";

/** A rule a tiered enrollment schedule must pass. Check returns its problems, or none. */
export interface TieredEnrollmentScheduleRule {
  check(item: TieredEnrollmentSchedule): string[];
}

export class TieredEnrollmentScheduleApprovedGuardRule implements TieredEnrollmentScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: TieredEnrollmentSchedule): string[] {
    if (item.approved && item.updatedAt > this.limit) return [`updated at ${item.updatedAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

export class TieredEnrollmentScheduleQuantityRangeRule implements TieredEnrollmentScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredEnrollmentSchedule): string[] {
    const value = item.quantity;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`quantity ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`quantity ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class TieredEnrollmentScheduleRequiredOwnerIdRule implements TieredEnrollmentScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEnrollmentSchedule): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class TieredEnrollmentScheduleRequiredCodeRule implements TieredEnrollmentScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredEnrollmentSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered enrollment schedule. */
export class TieredEnrollmentScheduleValidator {
  rules: TieredEnrollmentScheduleRule[];

  constructor(rules: TieredEnrollmentScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: TieredEnrollmentSchedule): string[] {
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

  requireValid(item: TieredEnrollmentSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredEnrollmentSchedule[]): Map<string, string[]> {
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

export function defaultTieredEnrollmentScheduleValidator(): TieredEnrollmentScheduleValidator {
  return new TieredEnrollmentScheduleValidator(
    [
      new TieredEnrollmentScheduleApprovedGuardRule(86400),
      new TieredEnrollmentScheduleQuantityRangeRule(120, 1000),
      new TieredEnrollmentScheduleRequiredOwnerIdRule("tiered enrollment schedule needs a value"),
      new TieredEnrollmentScheduleRequiredCodeRule("tiered enrollment schedule needs a value"),
    ],
  );
}
