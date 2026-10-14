import { ProofProposal } from "./proof-proposal.js";

/** A rule a proof proposal must pass. Check returns its problems, or none. */
export interface ProofProposalRule {
  check(item: ProofProposal): string[];
}

export class ProofProposalRequiredTitleRule implements ProofProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ProofProposalWeightRangeRule implements ProofProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofProposal): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class ProofProposalTitleLengthRule implements ProofProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ProofProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ProofProposalRequiredCohortRule implements ProofProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofProposal): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class ProofProposalUpdatedAtRangeRule implements ProofProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ProofProposal): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ProofProposalRequiredCodeRule implements ProofProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ProofProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a proof proposal. */
export class ProofProposalValidator {
  rules: ProofProposalRule[];

  constructor(rules: ProofProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ProofProposal): string[] {
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

  requireValid(item: ProofProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ProofProposal[]): Map<string, string[]> {
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

export function defaultProofProposalValidator(): ProofProposalValidator {
  return new ProofProposalValidator(
    [
      new ProofProposalRequiredTitleRule("proof proposal needs an entry"),
      new ProofProposalWeightRangeRule(0.5, 1806.5),
      new ProofProposalTitleLengthRule(64),
      new ProofProposalRequiredCohortRule("proof proposal needs this field"),
      new ProofProposalUpdatedAtRangeRule(255, 3600),
      new ProofProposalRequiredCodeRule("proof proposal needs a value"),
    ],
  );
}
