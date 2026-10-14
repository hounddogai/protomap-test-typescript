import * as text from "../../../../kit/text.js";
import { BatchedChallengeProposal } from "./batched-challenge-proposal.js";

/** A rule a batched challenge proposal must pass. Check returns its problems, or none. */
export interface BatchedChallengeProposalRule {
  check(item: BatchedChallengeProposal): string[];
}

export class BatchedChallengeProposalPriorityRangeRule implements BatchedChallengeProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedChallengeProposal): string[] {
    const value = item.priority;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`priority ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`priority ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class BatchedChallengeProposalAllowedLabelRule implements BatchedChallengeProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: BatchedChallengeProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is inconsistent`];
    return [];
  }
}

export class BatchedChallengeProposalRequiredLabelRule implements BatchedChallengeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BatchedChallengeProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a batched challenge proposal. */
export class BatchedChallengeProposalValidator {
  rules: BatchedChallengeProposalRule[];

  constructor(rules: BatchedChallengeProposalRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedChallengeProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedChallengeProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedChallengeProposal[]): Map<string, string[]> {
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

export function defaultBatchedChallengeProposalValidator(): BatchedChallengeProposalValidator {
  return new BatchedChallengeProposalValidator(
    [
      new BatchedChallengeProposalPriorityRangeRule(80, 86400),
      new BatchedChallengeProposalAllowedLabelRule(["batched"]),
      new BatchedChallengeProposalRequiredLabelRule("batched challenge proposal needs this field"),
    ],
  );
}
