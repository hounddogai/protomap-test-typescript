import * as text from "../../../../kit/text.js";
import { PacingProposal } from "./pacing-proposal.js";

/** A rule a pacing proposal must pass. Check returns its problems, or none. */
export interface PacingProposalRule {
  check(item: PacingProposal): string[];
}

export class PacingProposalAllowedLocaleRule implements PacingProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PacingProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is missing`];
    return [];
  }
}

export class PacingProposalFrequencyCapRangeRule implements PacingProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PacingProposal): string[] {
    const value = item.frequencyCap;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`frequency cap ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`frequency cap ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PacingProposalRequiredCohortRule implements PacingProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingProposal): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class PacingProposalRequiredLabelRule implements PacingProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PacingProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a pacing proposal. */
export class PacingProposalValidator {
  rules: PacingProposalRule[];

  constructor(rules: PacingProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PacingProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PacingProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PacingProposal[]): Map<string, string[]> {
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

export function defaultPacingProposalValidator(): PacingProposalValidator {
  return new PacingProposalValidator(
    [
      new PacingProposalAllowedLocaleRule([]),
      new PacingProposalFrequencyCapRangeRule(255, 3600),
      new PacingProposalRequiredCohortRule("pacing proposal needs an entry"),
      new PacingProposalRequiredLabelRule("pacing proposal needs a value"),
    ],
  );
}
