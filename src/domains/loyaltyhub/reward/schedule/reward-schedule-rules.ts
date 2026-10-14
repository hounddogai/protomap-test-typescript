import { RewardSchedule } from "./reward-schedule.js";

/** A rule a reward schedule must pass. Check returns its problems, or none. */
export interface RewardScheduleRule {
  check(item: RewardSchedule): string[];
}

export class RewardSchedulePriorityRangeRule implements RewardScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardSchedule): string[] {
    const value = item.priority;
    if (value < this.min || value > this.max) return [`priority ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardScheduleTitleLengthRule implements RewardScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardSchedule): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardScheduleRetriesRangeRule implements RewardScheduleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardSchedule): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardScheduleCodeLengthRule implements RewardScheduleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardSchedule): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward schedule. */
export class RewardScheduleValidator {
  rules: RewardScheduleRule[];

  constructor(rules: RewardScheduleRule[]) {
    this.rules = rules;
  }

  validate(item: RewardSchedule): string[] {
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

  requireValid(item: RewardSchedule): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardSchedule[]): Map<string, string[]> {
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

export function defaultRewardScheduleValidator(): RewardScheduleValidator {
  return new RewardScheduleValidator(
    [
      new RewardSchedulePriorityRangeRule(80, 3600),
      new RewardScheduleTitleLengthRule(1000),
      new RewardScheduleRetriesRangeRule(64, 64),
      new RewardScheduleCodeLengthRule(16),
    ],
  );
}
