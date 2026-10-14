import * as text from "../../../../kit/text.js";
import { RegionalPostProposal } from "./regional-post-proposal.js";

/** A rule a regional post proposal must pass. Check returns its problems, or none. */
export interface RegionalPostProposalRule {
  check(item: RegionalPostProposal): string[];
}

export class RegionalPostProposalFrequencyCapRangeRule implements RegionalPostProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RegionalPostProposal): string[] {
    const value = item.frequencyCap;
    if (value < this.min || value > this.max) return [`frequency cap ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RegionalPostProposalLabelLengthRule implements RegionalPostProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RegionalPostProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RegionalPostProposalAllowedTitleRule implements RegionalPostProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RegionalPostProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is duplicated`];
    return [];
  }
}

/** Runs every rule of a regional post proposal. */
export class RegionalPostProposalValidator {
  rules: RegionalPostProposalRule[];

  constructor(rules: RegionalPostProposalRule[]) {
    this.rules = rules;
  }

  validate(item: RegionalPostProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RegionalPostProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RegionalPostProposal[]): Map<string, string[]> {
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

export function defaultRegionalPostProposalValidator(): RegionalPostProposalValidator {
  return new RegionalPostProposalValidator(
    [
      new RegionalPostProposalFrequencyCapRangeRule(16, 3600),
      new RegionalPostProposalLabelLengthRule(16),
      new RegionalPostProposalAllowedTitleRule([]),
    ],
  );
}
