import * as text from "../../../../kit/text.js";
import { StrictLeaderboardCheckpoint } from "./strict-leaderboard-checkpoint.js";

/** A rule a strict leaderboard checkpoint must pass. Check returns its problems, or none. */
export interface StrictLeaderboardCheckpointRule {
  check(item: StrictLeaderboardCheckpoint): string[];
}

export class StrictLeaderboardCheckpointRequiredLabelRule implements StrictLeaderboardCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictLeaderboardCheckpoint): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class StrictLeaderboardCheckpointTimezoneLengthRule implements StrictLeaderboardCheckpointRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictLeaderboardCheckpoint): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictLeaderboardCheckpointAllowedUnitRule implements StrictLeaderboardCheckpointRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictLeaderboardCheckpoint): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is stale`];
    return [];
  }
}

export class StrictLeaderboardCheckpointRequiredUnitRule implements StrictLeaderboardCheckpointRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: StrictLeaderboardCheckpoint): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a strict leaderboard checkpoint. */
export class StrictLeaderboardCheckpointValidator {
  rules: StrictLeaderboardCheckpointRule[];

  constructor(rules: StrictLeaderboardCheckpointRule[]) {
    this.rules = rules;
  }

  validate(item: StrictLeaderboardCheckpoint): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: StrictLeaderboardCheckpoint): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictLeaderboardCheckpoint[]): Map<string, string[]> {
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

export function defaultStrictLeaderboardCheckpointValidator(): StrictLeaderboardCheckpointValidator {
  return new StrictLeaderboardCheckpointValidator(
    [
      new StrictLeaderboardCheckpointRequiredLabelRule("strict leaderboard checkpoint needs a value"),
      new StrictLeaderboardCheckpointTimezoneLengthRule(1000),
      new StrictLeaderboardCheckpointAllowedUnitRule(["fallback", "capped", "adaptive"]),
      new StrictLeaderboardCheckpointRequiredUnitRule("strict leaderboard checkpoint needs a value"),
    ],
  );
}
