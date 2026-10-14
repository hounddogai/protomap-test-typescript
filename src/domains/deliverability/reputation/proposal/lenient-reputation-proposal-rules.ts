import * as text from "../../../../kit/text.js";
import { LenientReputationProposal } from "./lenient-reputation-proposal.js";

/** A rule a lenient reputation proposal must pass. Check returns its problems, or none. */
export interface LenientReputationProposalRule {
  check(item: LenientReputationProposal): string[];
}

export class LenientReputationProposalBidRangeRule implements LenientReputationProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientReputationProposal): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LenientReputationProposalRequiredCodeRule implements LenientReputationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientReputationProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientReputationProposalAllowedLabelRule implements LenientReputationProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientReputationProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is above maximum`];
    return [];
  }
}

/** Runs every rule of a lenient reputation proposal. */
export class LenientReputationProposalValidator {
  rules: LenientReputationProposalRule[];

  constructor(rules: LenientReputationProposalRule[]) {
    this.rules = rules;
  }

  validate(item: LenientReputationProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientReputationProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientReputationProposal[]): Map<string, string[]> {
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

export function defaultLenientReputationProposalValidator(): LenientReputationProposalValidator {
  return new LenientReputationProposalValidator(
    [
      new LenientReputationProposalBidRangeRule(2.8, 4693),
      new LenientReputationProposalRequiredCodeRule("lenient reputation proposal needs this field"),
      new LenientReputationProposalAllowedLabelRule(["scheduled", "primary"]),
    ],
  );
}
