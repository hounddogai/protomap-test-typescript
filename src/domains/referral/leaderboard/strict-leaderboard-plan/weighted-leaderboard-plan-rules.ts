import * as text from "../../../../kit/text.js";
import { WeightedLeaderboardPlan } from "./weighted-leaderboard-plan.js";

/** A rule a weighted leaderboard plan must pass. Check returns its problems, or none. */
export interface WeightedLeaderboardPlanRule {
  check(item: WeightedLeaderboardPlan): string[];
}

export class WeightedLeaderboardPlanAllowedCodeRule implements WeightedLeaderboardPlanRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WeightedLeaderboardPlan): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is missing`];
    return [];
  }
}

export class WeightedLeaderboardPlanCodeLengthRule implements WeightedLeaderboardPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedLeaderboardPlan): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedLeaderboardPlanCurrencyLengthRule implements WeightedLeaderboardPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedLeaderboardPlan): string[] {
    const size = item.currency.length;
    if (size > this.maxLength) return [`currency is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WeightedLeaderboardPlanLabelLengthRule implements WeightedLeaderboardPlanRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WeightedLeaderboardPlan): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a weighted leaderboard plan. */
export class WeightedLeaderboardPlanValidator {
  rules: WeightedLeaderboardPlanRule[];

  constructor(rules: WeightedLeaderboardPlanRule[]) {
    this.rules = rules;
  }

  validate(item: WeightedLeaderboardPlan): string[] {
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

  requireValid(item: WeightedLeaderboardPlan): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WeightedLeaderboardPlan[]): Map<string, string[]> {
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

export function defaultWeightedLeaderboardPlanValidator(): WeightedLeaderboardPlanValidator {
  return new WeightedLeaderboardPlanValidator(
    [
      new WeightedLeaderboardPlanAllowedCodeRule(["pending"]),
      new WeightedLeaderboardPlanCodeLengthRule(3600),
      new WeightedLeaderboardPlanCurrencyLengthRule(80),
      new WeightedLeaderboardPlanLabelLengthRule(1000),
    ],
  );
}
