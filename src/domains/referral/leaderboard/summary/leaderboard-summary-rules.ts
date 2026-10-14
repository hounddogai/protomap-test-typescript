import * as text from "../../../../kit/text.js";
import { LeaderboardSummary } from "./leaderboard-summary.js";

/** A rule a leaderboard summary must pass. Check returns its problems, or none. */
export interface LeaderboardSummaryRule {
  check(item: LeaderboardSummary): string[];
}

export class LeaderboardSummaryDescriptionLengthRule implements LeaderboardSummaryRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardSummary): string[] {
    const size = item.description.length;
    if (size > this.maxLength) return [`description is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardSummaryAllowedCodeRule implements LeaderboardSummaryRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LeaderboardSummary): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class LeaderboardSummaryRequiredLabelRule implements LeaderboardSummaryRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LeaderboardSummary): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a leaderboard summary. */
export class LeaderboardSummaryValidator {
  rules: LeaderboardSummaryRule[];

  constructor(rules: LeaderboardSummaryRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardSummary): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LeaderboardSummary): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardSummary[]): Map<string, string[]> {
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

export function defaultLeaderboardSummaryValidator(): LeaderboardSummaryValidator {
  return new LeaderboardSummaryValidator(
    [
      new LeaderboardSummaryDescriptionLengthRule(120),
      new LeaderboardSummaryAllowedCodeRule(["rolling", "seasonal", "adaptive"]),
      new LeaderboardSummaryRequiredLabelRule("leaderboard summary needs an entry"),
    ],
  );
}
