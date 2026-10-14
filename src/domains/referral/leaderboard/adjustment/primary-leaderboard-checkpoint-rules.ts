import { PrimaryLeaderboardCheckpoint } from "./primary-leaderboard-checkpoint.js";

/** A rule a primary leaderboard checkpoint must pass. Check returns its problems, or none. */
export interface PrimaryLeaderboardCheckpointRule {
  check(item: PrimaryLeaderboardCheckpoint): string[];
}

export class PrimaryLeaderboardCheckpointLimitRangeRule implements PrimaryLeaderboardCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLeaderboardCheckpoint): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryLeaderboardCheckpointCodeLengthRule implements PrimaryLeaderboardCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryLeaderboardCheckpoint): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryLeaderboardCheckpointQuantityRangeRule implements PrimaryLeaderboardCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryLeaderboardCheckpoint): string[] {
    const value = item.quantity;
    if (value < this.min || value > this.max) return [`quantity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PrimaryLeaderboardCheckpointRequiredCodeRule implements PrimaryLeaderboardCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryLeaderboardCheckpoint): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryLeaderboardCheckpointLabelLengthRule implements PrimaryLeaderboardCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryLeaderboardCheckpoint): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary leaderboard checkpoint. */
export class PrimaryLeaderboardCheckpointValidator {
  rules: PrimaryLeaderboardCheckpointRule[];

  constructor(rules: PrimaryLeaderboardCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryLeaderboardCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryLeaderboardCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryLeaderboardCheckpoint[]): Map<string, string[]> {
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

export function defaultPrimaryLeaderboardCheckpointValidator(): PrimaryLeaderboardCheckpointValidator {
  return new PrimaryLeaderboardCheckpointValidator(
    [
      new PrimaryLeaderboardCheckpointLimitRangeRule(120, 86400),
      new PrimaryLeaderboardCheckpointCodeLengthRule(64),
      new PrimaryLeaderboardCheckpointQuantityRangeRule(255, 3600),
      new PrimaryLeaderboardCheckpointRequiredCodeRule("primary leaderboard checkpoint needs an entry"),
      new PrimaryLeaderboardCheckpointLabelLengthRule(32),
    ],
  );
}
