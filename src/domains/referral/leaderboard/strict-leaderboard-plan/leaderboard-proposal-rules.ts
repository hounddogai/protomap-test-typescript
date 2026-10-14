import { LeaderboardProposal } from "./leaderboard-proposal.js";

/** A rule a leaderboard proposal must pass. Check returns its problems, or none. */
export interface LeaderboardProposalRule {
  check(item: LeaderboardProposal): string[];
}

export class LeaderboardProposalCodeLengthRule implements LeaderboardProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LeaderboardProposalVersionRangeRule implements LeaderboardProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LeaderboardProposal): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LeaderboardProposalLabelLengthRule implements LeaderboardProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LeaderboardProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a leaderboard proposal. */
export class LeaderboardProposalValidator {
  rules: LeaderboardProposalRule[];

  constructor(rules: LeaderboardProposalRule[]) {
    this.rules = rules;
  }

  validate(item: LeaderboardProposal): string[] {
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

  requireValid(item: LeaderboardProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LeaderboardProposal[]): Map<string, string[]> {
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

export function defaultLeaderboardProposalValidator(): LeaderboardProposalValidator {
  return new LeaderboardProposalValidator(
    [
      new LeaderboardProposalCodeLengthRule(32),
      new LeaderboardProposalVersionRangeRule(32, 86400),
      new LeaderboardProposalLabelLengthRule(3600),
    ],
  );
}
