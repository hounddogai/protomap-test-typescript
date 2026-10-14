import { NudgeCheckpoint } from "./nudge-checkpoint.js";

/** A rule a nudge checkpoint must pass. Check returns its problems, or none. */
export interface NudgeCheckpointRule {
  check(item: NudgeCheckpoint): string[];
}

export class NudgeCheckpointNameLengthRule implements NudgeCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: NudgeCheckpoint): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class NudgeCheckpointExpiresAtRangeRule implements NudgeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeCheckpoint): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class NudgeCheckpointClicksRangeRule implements NudgeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: NudgeCheckpoint): string[] {
    const value = item.clicks;
    if (value < this.min || value > this.max) return [`clicks ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a nudge checkpoint. */
export class NudgeCheckpointValidator {
  rules: NudgeCheckpointRule[];

  constructor(rules: NudgeCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeCheckpoint): string[] {
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

  requireValid(item: NudgeCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeCheckpoint[]): Map<string, string[]> {
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

export function defaultNudgeCheckpointValidator(): NudgeCheckpointValidator {
  return new NudgeCheckpointValidator(
    [
      new NudgeCheckpointNameLengthRule(64),
      new NudgeCheckpointExpiresAtRangeRule(80, 120),
      new NudgeCheckpointClicksRangeRule(32, 64),
    ],
  );
}
