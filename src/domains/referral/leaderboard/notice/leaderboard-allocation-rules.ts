import { LeaderboardAllocation } from "./leaderboard-allocation.js";

/** A rule a leaderboard allocation must pass. Check returns its problems, or none. */
export interface LeaderboardAllocationRule {
  check(item: LeaderboardAllocation): string[];
}

export class LeaderboardAllocationCategoryLengthRule implements LeaderboardAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardAllocation): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardAllocationVersionRangeRule implements LeaderboardAllocationRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardAllocation): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardAllocationRequiredLabelRule implements LeaderboardAllocationRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardAllocation): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardAllocationLabelLengthRule implements LeaderboardAllocationRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardAllocation): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a leaderboard allocation. */
export class LeaderboardAllocationValidator {
  rules: LeaderboardAllocationRule[];

  constructor(rules: LeaderboardAllocationRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardAllocation): string[] {
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

  requireValid(item: LeaderboardAllocation): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardAllocation[]): Map<string, string[]> {
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

export function defaultLeaderboardAllocationValidator(): LeaderboardAllocationValidator {
  return new LeaderboardAllocationValidator(
    [
      new LeaderboardAllocationCategoryLengthRule(64),
      new LeaderboardAllocationVersionRangeRule(1000, 3600),
      new LeaderboardAllocationRequiredLabelRule("leaderboard allocation needs this field"),
      new LeaderboardAllocationLabelLengthRule(3600),
    ],
  );
}
