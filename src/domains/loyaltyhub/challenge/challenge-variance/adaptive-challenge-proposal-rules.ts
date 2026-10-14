import { AdaptiveChallengeProposal } from "./adaptive-challenge-proposal.js";

/** A rule a adaptive challenge proposal must pass. Check returns its problems, or none. */
export interface AdaptiveChallengeProposalRule {
  check(item: AdaptiveChallengeProposal): string[];
}

export class AdaptiveChallengeProposalCodeLengthRule implements AdaptiveChallengeProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveChallengeProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveChallengeProposalRequiredNameRule implements AdaptiveChallengeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveChallengeProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveChallengeProposalFrequencyCapRangeRule implements AdaptiveChallengeProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveChallengeProposal): string[] {
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

export class AdaptiveChallengeProposalRequiredCodeRule implements AdaptiveChallengeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveChallengeProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive challenge proposal. */
export class AdaptiveChallengeProposalValidator {
  rules: AdaptiveChallengeProposalRule[];

  constructor(rules: AdaptiveChallengeProposalRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveChallengeProposal): string[] {
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

  requireValid(item: AdaptiveChallengeProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveChallengeProposal[]): Map<string, string[]> {
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

export function defaultAdaptiveChallengeProposalValidator(): AdaptiveChallengeProposalValidator {
  return new AdaptiveChallengeProposalValidator(
    [
      new AdaptiveChallengeProposalCodeLengthRule(120),
      new AdaptiveChallengeProposalRequiredNameRule("adaptive challenge proposal needs an entry"),
      new AdaptiveChallengeProposalFrequencyCapRangeRule(32, 255),
      new AdaptiveChallengeProposalRequiredCodeRule("adaptive challenge proposal needs an entry"),
    ],
  );
}
