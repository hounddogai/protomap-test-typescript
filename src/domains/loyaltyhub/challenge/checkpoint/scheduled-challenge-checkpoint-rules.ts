import { ScheduledChallengeCheckpoint } from "./scheduled-challenge-checkpoint.js";

/** A rule a scheduled challenge checkpoint must pass. Check returns its problems, or none. */
export interface ScheduledChallengeCheckpointRule {
  check(item: ScheduledChallengeCheckpoint): string[];
}

export class ScheduledChallengeCheckpointRequiredTimezoneRule implements ScheduledChallengeCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledChallengeCheckpoint): string[] {
    if (item.timezone.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledChallengeCheckpointCountryLengthRule implements ScheduledChallengeCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledChallengeCheckpoint): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledChallengeCheckpointCreatedAtRangeRule implements ScheduledChallengeCheckpointRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledChallengeCheckpoint): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled challenge checkpoint. */
export class ScheduledChallengeCheckpointValidator {
  rules: ScheduledChallengeCheckpointRule[];

  constructor(rules: ScheduledChallengeCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledChallengeCheckpoint): string[] {
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

  requireValid(item: ScheduledChallengeCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledChallengeCheckpoint[]): Map<string, string[]> {
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

export function defaultScheduledChallengeCheckpointValidator(): ScheduledChallengeCheckpointValidator {
  return new ScheduledChallengeCheckpointValidator(
    [
      new ScheduledChallengeCheckpointRequiredTimezoneRule("scheduled challenge checkpoint needs this field"),
      new ScheduledChallengeCheckpointCountryLengthRule(16),
      new ScheduledChallengeCheckpointCreatedAtRangeRule(16, 32),
    ],
  );
}
