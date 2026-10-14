import { BatchedLeaderboardProposal } from "./batched-leaderboard-proposal.js";

/** A rule a batched leaderboard proposal must pass. Check returns its problems, or none. */
export interface BatchedLeaderboardProposalRule {
  check(item: BatchedLeaderboardProposal): string[];
}

export class BatchedLeaderboardProposalBatchSizeRangeRule implements BatchedLeaderboardProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedLeaderboardProposal): string[] {
    const value = item.batchSize;
    if (value < this.min || value > this.max) return [`batch size ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedLeaderboardProposalArchivedGuardRule implements BatchedLeaderboardProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: BatchedLeaderboardProposal): string[] {
    if (item.archived && item.batchSize > this.limit) return [`batch size ${item.batchSize} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class BatchedLeaderboardProposalRequiredOwnerIdRule implements BatchedLeaderboardProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedLeaderboardProposal): string[] {
    if (item.ownerId.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedLeaderboardProposalRequiredCodeRule implements BatchedLeaderboardProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedLeaderboardProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class BatchedLeaderboardProposalCodePrefixRule implements BatchedLeaderboardProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedLeaderboardProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BatchedLeaderboardProposalNameLengthRule implements BatchedLeaderboardProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedLeaderboardProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a batched leaderboard proposal. */
export class BatchedLeaderboardProposalValidator {
  rules: BatchedLeaderboardProposalRule[];

  constructor(rules: BatchedLeaderboardProposalRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedLeaderboardProposal): string[] {
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

  requireValid(item: BatchedLeaderboardProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedLeaderboardProposal[]): Map<string, string[]> {
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

export function defaultBatchedLeaderboardProposalValidator(): BatchedLeaderboardProposalValidator {
  return new BatchedLeaderboardProposalValidator(
    [
      new BatchedLeaderboardProposalBatchSizeRangeRule(16, 120),
      new BatchedLeaderboardProposalArchivedGuardRule(120),
      new BatchedLeaderboardProposalRequiredOwnerIdRule("batched leaderboard proposal needs a value"),
      new BatchedLeaderboardProposalRequiredCodeRule("batched leaderboard proposal needs an entry"),
      new BatchedLeaderboardProposalCodePrefixRule("ACM"),
      new BatchedLeaderboardProposalNameLengthRule(3600),
    ],
  );
}
