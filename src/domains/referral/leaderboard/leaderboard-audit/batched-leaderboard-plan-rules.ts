import { BatchedLeaderboardPlan } from "./batched-leaderboard-plan.js";

/** A rule a batched leaderboard plan must pass. Check returns its problems, or none. */
export interface BatchedLeaderboardPlanRule {
  check(item: BatchedLeaderboardPlan): string[];
}

export class BatchedLeaderboardPlanRequiredCodeRule implements BatchedLeaderboardPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedLeaderboardPlan): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedLeaderboardPlanRequiredNameRule implements BatchedLeaderboardPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedLeaderboardPlan): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedLeaderboardPlanCodeLengthRule implements BatchedLeaderboardPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedLeaderboardPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched leaderboard plan. */
export class BatchedLeaderboardPlanValidator {
  rules: BatchedLeaderboardPlanRule[];

  constructor(rules: BatchedLeaderboardPlanRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedLeaderboardPlan): string[] {
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

  requireValid(item: BatchedLeaderboardPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedLeaderboardPlan[]): Map<string, string[]> {
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

export function defaultBatchedLeaderboardPlanValidator(): BatchedLeaderboardPlanValidator {
  return new BatchedLeaderboardPlanValidator(
    [
      new BatchedLeaderboardPlanRequiredCodeRule("batched leaderboard plan needs an entry"),
      new BatchedLeaderboardPlanRequiredNameRule("batched leaderboard plan needs this field"),
      new BatchedLeaderboardPlanCodeLengthRule(86400),
    ],
  );
}
