import { BranchSchedule } from "./branch-schedule.js";

/** A rule a branch schedule must pass. Check returns its problems, or none. */
export interface BranchScheduleRule {
  check(item: BranchSchedule): string[];
}

export class BranchScheduleVisibleGuardRule implements BranchScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BranchSchedule): string[] {
    if (item.visible && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while visible`];
    return [];
  }
}

export class BranchScheduleRequiredCodeRule implements BranchScheduleRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BranchSchedule): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BranchScheduleBudgetRangeRule implements BranchScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchSchedule): string[] {
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

export class BranchScheduleRevisionRangeRule implements BranchScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BranchSchedule): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a branch schedule. */
export class BranchScheduleValidator {
  rules: BranchScheduleRule[];

  constructor(rules: BranchScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: BranchSchedule): string[] {
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

  requireValid(item: BranchSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BranchSchedule[]): Map<string, string[]> {
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

export function defaultBranchScheduleValidator(): BranchScheduleValidator {
  return new BranchScheduleValidator(
    [
      new BranchScheduleVisibleGuardRule(32),
      new BranchScheduleRequiredCodeRule("branch schedule needs a value"),
      new BranchScheduleBudgetRangeRule(1.4, 1435.4),
      new BranchScheduleRevisionRangeRule(1000, 1000),
    ],
  );
}
