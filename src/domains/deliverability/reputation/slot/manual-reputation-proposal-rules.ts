import * as text from "../../../../kit/text.js";
import { ManualReputationProposal } from "./manual-reputation-proposal.js";

/** A rule a manual reputation proposal must pass. Check returns its problems, or none. */
export interface ManualReputationProposalRule {
  check(item: ManualReputationProposal): string[];
}

export class ManualReputationProposalOpenRateRangeRule implements ManualReputationProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ManualReputationProposal): string[] {
    const value = item.openRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`open rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`open rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class ManualReputationProposalRequiredCategoryRule implements ManualReputationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualReputationProposal): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

export class ManualReputationProposalAllowedCategoryRule implements ManualReputationProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualReputationProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.category))) return [`category ${item.category} is expired`];
    return [];
  }
}

export class ManualReputationProposalNameLengthRule implements ManualReputationProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ManualReputationProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a manual reputation proposal. */
export class ManualReputationProposalValidator {
  rules: ManualReputationProposalRule[];

  constructor(rules: ManualReputationProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ManualReputationProposal): string[] {
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

  requireValid(item: ManualReputationProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualReputationProposal[]): Map<string, string[]> {
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

export function defaultManualReputationProposalValidator(): ManualReputationProposalValidator {
  return new ManualReputationProposalValidator(
    [
      new ManualReputationProposalOpenRateRangeRule(7.7, 2584.7),
      new ManualReputationProposalRequiredCategoryRule("manual reputation proposal needs a value"),
      new ManualReputationProposalAllowedCategoryRule(["scheduled", "tiered"]),
      new ManualReputationProposalNameLengthRule(80),
    ],
  );
}
