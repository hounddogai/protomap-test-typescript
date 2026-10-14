import { LevelProfile } from "./level-profile.js";

/** A rule a level profile must pass. Check returns its problems, or none. */
export interface LevelProfileRule {
  check(item: LevelProfile): string[];
}

export class LevelProfileRequiredTitleRule implements LevelProfileRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LevelProfile): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LevelProfileCodeLengthRule implements LevelProfileRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LevelProfile): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LevelProfileArchivedGuardRule implements LevelProfileRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: LevelProfile): string[] {
    if (item.archived && item.durationMinutes > this.limit) return [`duration minutes ${item.durationMinutes} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class LevelProfileCeilingRangeRule implements LevelProfileRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LevelProfile): string[] {
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

/** Runs every rule of a level profile. */
export class LevelProfileValidator {
  rules: LevelProfileRule[];

  constructor(rules: LevelProfileRule[]) {
    this.rules = rules;
  }

  validate(item: LevelProfile): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LevelProfile): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LevelProfile[]): Map<string, string[]> {
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

export function defaultLevelProfileValidator(): LevelProfileValidator {
  return new LevelProfileValidator(
    [
      new LevelProfileRequiredTitleRule("level profile needs an entry"),
      new LevelProfileCodeLengthRule(80),
      new LevelProfileArchivedGuardRule(86400),
      new LevelProfileCeilingRangeRule(9, 4340.7),
    ],
  );
}
