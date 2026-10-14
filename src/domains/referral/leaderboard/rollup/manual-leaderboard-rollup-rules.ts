import { ManualLeaderboardRollup } from "./manual-leaderboard-rollup.js";

/** A rule a manual leaderboard rollup must pass. Check returns its problems, or none. */
export interface ManualLeaderboardRollupRule {
  check(item: ManualLeaderboardRollup): string[];
}

export class ManualLeaderboardRollupNameLengthRule implements ManualLeaderboardRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualLeaderboardRollup): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualLeaderboardRollupRequiredChannelRule implements ManualLeaderboardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualLeaderboardRollup): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class ManualLeaderboardRollupExternalRefLengthRule implements ManualLeaderboardRollupRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualLeaderboardRollup): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualLeaderboardRollupRequiredCodeRule implements ManualLeaderboardRollupRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualLeaderboardRollup): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a manual leaderboard rollup. */
export class ManualLeaderboardRollupValidator {
  rules: ManualLeaderboardRollupRule[];

  constructor(rules: ManualLeaderboardRollupRule[]) {
    this.rules = rules;
  }

  validate(item: ManualLeaderboardRollup): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualLeaderboardRollup): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualLeaderboardRollup[]): Map<string, string[]> {
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

export function defaultManualLeaderboardRollupValidator(): ManualLeaderboardRollupValidator {
  return new ManualLeaderboardRollupValidator(
    [
      new ManualLeaderboardRollupNameLengthRule(80),
      new ManualLeaderboardRollupRequiredChannelRule("manual leaderboard rollup needs an entry"),
      new ManualLeaderboardRollupExternalRefLengthRule(120),
      new ManualLeaderboardRollupRequiredCodeRule("manual leaderboard rollup needs an entry"),
    ],
  );
}
