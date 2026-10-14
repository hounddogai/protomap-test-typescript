import { ManualLeaderboardMilestone } from "./manual-leaderboard-milestone.js";

/** A rule a manual leaderboard milestone must pass. Check returns its problems, or none. */
export interface ManualLeaderboardMilestoneRule {
  check(item: ManualLeaderboardMilestone): string[];
}

export class ManualLeaderboardMilestoneDescriptionLengthRule implements ManualLeaderboardMilestoneRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualLeaderboardMilestone): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ManualLeaderboardMilestoneRequiredCodeRule implements ManualLeaderboardMilestoneRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualLeaderboardMilestone): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualLeaderboardMilestoneFloorValueRangeRule implements ManualLeaderboardMilestoneRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualLeaderboardMilestone): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a manual leaderboard milestone. */
export class ManualLeaderboardMilestoneValidator {
  rules: ManualLeaderboardMilestoneRule[];

  constructor(rules: ManualLeaderboardMilestoneRule[]) {
    this.rules = rules;
  }

  validate(item: ManualLeaderboardMilestone): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualLeaderboardMilestone): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualLeaderboardMilestone[]): Map<string, string[]> {
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

export function defaultManualLeaderboardMilestoneValidator(): ManualLeaderboardMilestoneValidator {
  return new ManualLeaderboardMilestoneValidator(
    [
      new ManualLeaderboardMilestoneDescriptionLengthRule(1000),
      new ManualLeaderboardMilestoneRequiredCodeRule("manual leaderboard milestone needs an entry"),
      new ManualLeaderboardMilestoneFloorValueRangeRule(4.9, 3038.3),
    ],
  );
}
