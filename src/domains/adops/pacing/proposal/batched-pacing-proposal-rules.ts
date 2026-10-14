import { BatchedPacingProposal } from "./batched-pacing-proposal.js";

/** A rule a batched pacing proposal must pass. Check returns its problems, or none. */
export interface BatchedPacingProposalRule {
  check(item: BatchedPacingProposal): string[];
}

export class BatchedPacingProposalUtmSourceLengthRule implements BatchedPacingProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BatchedPacingProposal): string[] {
    const size = item.utmSource.length;
    if (size > this.maxLength) return [`utm source is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BatchedPacingProposalWeightRangeRule implements BatchedPacingProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPacingProposal): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BatchedPacingProposalConversionRateRangeRule implements BatchedPacingProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BatchedPacingProposal): string[] {
    const value = item.conversionRate;
    if (value < this.min || value > this.max) return [`conversion rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a batched pacing proposal. */
export class BatchedPacingProposalValidator {
  rules: BatchedPacingProposalRule[];

  constructor(rules: BatchedPacingProposalRule[]) {
    this.rules = rules;
  }

  validate(item: BatchedPacingProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BatchedPacingProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BatchedPacingProposal[]): Map<string, string[]> {
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

export function defaultBatchedPacingProposalValidator(): BatchedPacingProposalValidator {
  return new BatchedPacingProposalValidator(
    [
      new BatchedPacingProposalUtmSourceLengthRule(64),
      new BatchedPacingProposalWeightRangeRule(9, 2719.9),
      new BatchedPacingProposalConversionRateRangeRule(7.3, 727.1),
    ],
  );
}
