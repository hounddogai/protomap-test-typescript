import { RollingLevelCycle } from "./rolling-level-cycle.js";

/** A rule a rolling level cycle must pass. Check returns its problems, or none. */
export interface RollingLevelCycleRule {
  check(item: RollingLevelCycle): string[];
}

export class RollingLevelCycleWindowDaysRangeRule implements RollingLevelCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RollingLevelCycle): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RollingLevelCycleTitleLengthRule implements RollingLevelCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RollingLevelCycle): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RollingLevelCycleApprovedGuardRule implements RollingLevelCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: RollingLevelCycle): string[] {
    if (item.approved && item.endsAt > this.limit) return [`ends at ${item.endsAt} exceeds ${this.limit} while approved`];
    return [];
  }
}

/** Runs every rule of a rolling level cycle. */
export class RollingLevelCycleValidator {
  rules: RollingLevelCycleRule[];

  constructor(rules: RollingLevelCycleRule[]) {
    this.rules = rules;
  }

  validate(item: RollingLevelCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingLevelCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingLevelCycle[]): Map<string, string[]> {
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

export function defaultRollingLevelCycleValidator(): RollingLevelCycleValidator {
  return new RollingLevelCycleValidator(
    [
      new RollingLevelCycleWindowDaysRangeRule(120, 86400),
      new RollingLevelCycleTitleLengthRule(16),
      new RollingLevelCycleApprovedGuardRule(64),
    ],
  );
}
