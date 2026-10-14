import { BatchedQueueProposal } from "./batched-queue-proposal.js";

/** A rule a batched queue proposal must pass. Check returns its problems, or none. */
export interface BatchedQueueProposalRule {
  check(item: BatchedQueueProposal): string[];
}

export class BatchedQueueProposalWindowDaysRangeRule implements BatchedQueueProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedQueueProposal): string[] {
    const value = item.windowDays;
    if (value < this.min || value > this.max) return [`window days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedQueueProposalReviewerLengthRule implements BatchedQueueProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedQueueProposal): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedQueueProposalExpiresAtRangeRule implements BatchedQueueProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedQueueProposal): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedQueueProposalCodeLengthRule implements BatchedQueueProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedQueueProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedQueueProposalCodePrefixRule implements BatchedQueueProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BatchedQueueProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a batched queue proposal. */
export class BatchedQueueProposalValidator {
  rules: BatchedQueueProposalRule[];

  constructor(rules: BatchedQueueProposalRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedQueueProposal): string[] {
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

  requireValid(item: BatchedQueueProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedQueueProposal[]): Map<string, string[]> {
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

export function defaultBatchedQueueProposalValidator(): BatchedQueueProposalValidator {
  return new BatchedQueueProposalValidator(
    [
      new BatchedQueueProposalWindowDaysRangeRule(32, 86400),
      new BatchedQueueProposalReviewerLengthRule(80),
      new BatchedQueueProposalExpiresAtRangeRule(80, 120),
      new BatchedQueueProposalCodeLengthRule(80),
      new BatchedQueueProposalCodePrefixRule("X"),
    ],
  );
}
