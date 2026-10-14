import { RollingLeaderboardAssignment } from "./rolling-leaderboard-assignment.js";

/** A rule a rolling leaderboard assignment must pass. Check returns its problems, or none. */
export interface RollingLeaderboardAssignmentRule {
  check(item: RollingLeaderboardAssignment): string[];
}

export class RollingLeaderboardAssignmentRequiredTitleRule implements RollingLeaderboardAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLeaderboardAssignment): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class RollingLeaderboardAssignmentCodePrefixRule implements RollingLeaderboardAssignmentRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: RollingLeaderboardAssignment): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class RollingLeaderboardAssignmentRequiredUnitRule implements RollingLeaderboardAssignmentRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RollingLeaderboardAssignment): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a rolling leaderboard assignment. */
export class RollingLeaderboardAssignmentValidator {
  rules: RollingLeaderboardAssignmentRule[];

  constructor(rules: RollingLeaderboardAssignmentRule[]) {
    this.rules = rules;
  }

  validate(item: RollingLeaderboardAssignment): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RollingLeaderboardAssignment): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RollingLeaderboardAssignment[]): Map<string, string[]> {
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

export function defaultRollingLeaderboardAssignmentValidator(): RollingLeaderboardAssignmentValidator {
  return new RollingLeaderboardAssignmentValidator(
    [
      new RollingLeaderboardAssignmentRequiredTitleRule("rolling leaderboard assignment needs this field"),
      new RollingLeaderboardAssignmentCodePrefixRule("OPS"),
      new RollingLeaderboardAssignmentRequiredUnitRule("rolling leaderboard assignment needs an entry"),
    ],
  );
}
