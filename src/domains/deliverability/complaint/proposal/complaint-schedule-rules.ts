import { ComplaintSchedule } from "./complaint-schedule.js";

/** A rule a complaint schedule must pass. Check returns its problems, or none. */
export interface ComplaintScheduleRule {
  check(item: ComplaintSchedule): string[];
}

export class ComplaintScheduleRequiredCodeRule implements ComplaintScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ComplaintSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ComplaintScheduleBudgetRangeRule implements ComplaintScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintSchedule): string[] {
    const value = item.budget;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`budget ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`budget ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ComplaintScheduleRetriesRangeRule implements ComplaintScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ComplaintSchedule): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a complaint schedule. */
export class ComplaintScheduleValidator {
  rules: ComplaintScheduleRule[];

  constructor(rules: ComplaintScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ComplaintSchedule): string[] {
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

  requireValid(item: ComplaintSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ComplaintSchedule[]): Map<string, string[]> {
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

export function defaultComplaintScheduleValidator(): ComplaintScheduleValidator {
  return new ComplaintScheduleValidator(
    [
      new ComplaintScheduleRequiredCodeRule("complaint schedule needs a value"),
      new ComplaintScheduleBudgetRangeRule(5.5, 3953.4),
      new ComplaintScheduleRetriesRangeRule(1000, 86400),
    ],
  );
}
