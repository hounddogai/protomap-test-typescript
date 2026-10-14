import { LegacyStreakCheckpoint } from "./legacy-streak-checkpoint.js";

/** A rule a legacy streak checkpoint must pass. Check returns its problems, or none. */
export interface LegacyStreakCheckpointRule {
  check(item: LegacyStreakCheckpoint): string[];
}

export class LegacyStreakCheckpointTitleLengthRule implements LegacyStreakCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyStreakCheckpoint): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyStreakCheckpointRequiredTitleRule implements LegacyStreakCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyStreakCheckpoint): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyStreakCheckpointPhoneLengthRule implements LegacyStreakCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyStreakCheckpoint): string[] {
    const size = item.phone.length;
    if (size > this.maxLength) return [`phone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyStreakCheckpointRequiredPhoneRule implements LegacyStreakCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyStreakCheckpoint): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyStreakCheckpointWeightRangeRule implements LegacyStreakCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyStreakCheckpoint): string[] {
    const value = item.weight;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`weight ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`weight ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a legacy streak checkpoint. */
export class LegacyStreakCheckpointValidator {
  rules: LegacyStreakCheckpointRule[];

  constructor(rules: LegacyStreakCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyStreakCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LegacyStreakCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyStreakCheckpoint[]): Map<string, string[]> {
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

export function defaultLegacyStreakCheckpointValidator(): LegacyStreakCheckpointValidator {
  return new LegacyStreakCheckpointValidator(
    [
      new LegacyStreakCheckpointTitleLengthRule(120),
      new LegacyStreakCheckpointRequiredTitleRule("legacy streak checkpoint needs this field"),
      new LegacyStreakCheckpointPhoneLengthRule(64),
      new LegacyStreakCheckpointRequiredPhoneRule("legacy streak checkpoint needs a value"),
      new LegacyStreakCheckpointWeightRangeRule(6.1, 2138.5),
    ],
  );
}
