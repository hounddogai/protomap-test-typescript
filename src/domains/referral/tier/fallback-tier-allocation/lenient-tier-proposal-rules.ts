import { LenientTierProposal } from "./lenient-tier-proposal.js";

/** A rule a lenient tier proposal must pass. Check returns its problems, or none. */
export interface LenientTierProposalRule {
  check(item: LenientTierProposal): string[];
}

export class LenientTierProposalRequiredNameRule implements LenientTierProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientTierProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class LenientTierProposalNameLengthRule implements LenientTierProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientTierProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientTierProposalCohortLengthRule implements LenientTierProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientTierProposal): string[] {
    const size = item.cohort.length;
    if (size > this.maxLength) return [`cohort is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a lenient tier proposal. */
export class LenientTierProposalValidator {
  rules: LenientTierProposalRule[];

  constructor(rules: LenientTierProposalRule[]) {
    this.rules = rules;
  }

  validate(item: LenientTierProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientTierProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientTierProposal[]): Map<string, string[]> {
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

export function defaultLenientTierProposalValidator(): LenientTierProposalValidator {
  return new LenientTierProposalValidator(
    [
      new LenientTierProposalRequiredNameRule("lenient tier proposal needs this field"),
      new LenientTierProposalNameLengthRule(16),
      new LenientTierProposalCohortLengthRule(3600),
    ],
  );
}
