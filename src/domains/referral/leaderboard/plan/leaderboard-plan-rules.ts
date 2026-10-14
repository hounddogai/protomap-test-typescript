import { LeaderboardPlan } from "./leaderboard-plan.js";

/** A rule a leaderboard plan must pass. Check returns its problems, or none. */
export interface LeaderboardPlanRule {
  check(item: LeaderboardPlan): string[];
}

export class LeaderboardPlanLimitRangeRule implements LeaderboardPlanRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardPlan): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LeaderboardPlanCampaignRefLengthRule implements LeaderboardPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardPlan): string[] {
    const size = item.campaignRef.length;
    if (size > this.maxLength) return [`campaign ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardPlanRequiredLabelRule implements LeaderboardPlanRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardPlan): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class LeaderboardPlanCodeLengthRule implements LeaderboardPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a leaderboard plan. */
export class LeaderboardPlanValidator {
  rules: LeaderboardPlanRule[];

  constructor(rules: LeaderboardPlanRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardPlan): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardPlan[]): Map<string, string[]> {
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

export function defaultLeaderboardPlanValidator(): LeaderboardPlanValidator {
  return new LeaderboardPlanValidator(
    [
      new LeaderboardPlanLimitRangeRule(255, 3600),
      new LeaderboardPlanCampaignRefLengthRule(32),
      new LeaderboardPlanRequiredLabelRule("leaderboard plan needs an entry"),
      new LeaderboardPlanCodeLengthRule(32),
    ],
  );
}
