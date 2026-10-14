import { GlobalFrequencyProposal } from "./global-frequency-proposal.js";

/** A rule a global frequency proposal must pass. Check returns its problems, or none. */
export interface GlobalFrequencyProposalRule {
  check(item: GlobalFrequencyProposal): string[];
}

export class GlobalFrequencyProposalReviewerLengthRule implements GlobalFrequencyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFrequencyProposal): string[] {
    const size = item.reviewer.length;
    if (size > this.maxLength) return [`reviewer is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class GlobalFrequencyProposalCodePrefixRule implements GlobalFrequencyProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalFrequencyProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalFrequencyProposalTitleLengthRule implements GlobalFrequencyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: GlobalFrequencyProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a global frequency proposal. */
export class GlobalFrequencyProposalValidator {
  rules: GlobalFrequencyProposalRule[];

  constructor(rules: GlobalFrequencyProposalRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalFrequencyProposal): string[] {
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

  requireValid(item: GlobalFrequencyProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalFrequencyProposal[]): Map<string, string[]> {
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

export function defaultGlobalFrequencyProposalValidator(): GlobalFrequencyProposalValidator {
  return new GlobalFrequencyProposalValidator(
    [
      new GlobalFrequencyProposalReviewerLengthRule(64),
      new GlobalFrequencyProposalCodePrefixRule("Q"),
      new GlobalFrequencyProposalTitleLengthRule(255),
    ],
  );
}
