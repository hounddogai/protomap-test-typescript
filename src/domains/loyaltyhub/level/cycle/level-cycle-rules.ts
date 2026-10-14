import { LevelCycle } from "./level-cycle.js";

/** A rule a level cycle must pass. Check returns its problems, or none. */
export interface LevelCycleRule {
  check(item: LevelCycle): string[];
}

export class LevelCycleNameLengthRule implements LevelCycleRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelCycle): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelCyclePinnedGuardRule implements LevelCycleRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LevelCycle): string[] {
    if (item.pinned && item.cost > this.limit) return [`cost ${item.cost} exceeds ${this.limit} while pinned`];
    return [];
  }
}

export class LevelCycleCostRangeRule implements LevelCycleRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelCycle): string[] {
    const value = item.cost;
    if (value < this.min || value > this.max) return [`cost ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a level cycle. */
export class LevelCycleValidator {
  rules: LevelCycleRule[];

  constructor(rules: LevelCycleRule[]) {
    this.rules = rules;
  }

  validate(item: LevelCycle): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelCycle): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelCycle[]): Map<string, string[]> {
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

export function defaultLevelCycleValidator(): LevelCycleValidator {
  return new LevelCycleValidator(
    [
      new LevelCycleNameLengthRule(86400),
      new LevelCyclePinnedGuardRule(9.4),
      new LevelCycleCostRangeRule(9.9, 3551.7),
    ],
  );
}
