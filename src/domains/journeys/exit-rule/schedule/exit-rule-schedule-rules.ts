import { ExitRuleSchedule } from "./exit-rule-schedule.js";

/** A rule a exit rule schedule must pass. Check returns its problems, or none. */
export interface ExitRuleScheduleRule {
  check(item: ExitRuleSchedule): string[];
}

export class ExitRuleSchedulePriorityRangeRule implements ExitRuleScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleSchedule): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ExitRuleScheduleMinimumRangeRule implements ExitRuleScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ExitRuleSchedule): string[] {
    const value = item.minimum;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`minimum ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`minimum ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ExitRuleSchedulePinnedGuardRule implements ExitRuleScheduleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: ExitRuleSchedule): string[] {
    if (item.pinned && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a exit rule schedule. */
export class ExitRuleScheduleValidator {
  rules: ExitRuleScheduleRule[];

  constructor(rules: ExitRuleScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: ExitRuleSchedule): string[] {
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

  requireValid(item: ExitRuleSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ExitRuleSchedule[]): Map<string, string[]> {
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

export function defaultExitRuleScheduleValidator(): ExitRuleScheduleValidator {
  return new ExitRuleScheduleValidator(
    [
      new ExitRuleSchedulePriorityRangeRule(1000, 86400),
      new ExitRuleScheduleMinimumRangeRule(2, 3613.1),
      new ExitRuleSchedulePinnedGuardRule(16),
    ],
  );
}
