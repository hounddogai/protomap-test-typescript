import { ScheduledChallengeProposal } from "./scheduled-challenge-proposal.js";

/** A rule a scheduled challenge proposal must pass. Check returns its problems, or none. */
export interface ScheduledChallengeProposalRule {
  check(item: ScheduledChallengeProposal): string[];
}

export class ScheduledChallengeProposalCodeLengthRule implements ScheduledChallengeProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledChallengeProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledChallengeProposalTitleLengthRule implements ScheduledChallengeProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ScheduledChallengeProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ScheduledChallengeProposalRequiredContactEmailRule implements ScheduledChallengeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ScheduledChallengeProposal): string[] {
    if (item.contactEmail.trim() === "") return [this.message];
    return [];
  }
}

export class ScheduledChallengeProposalImpressionsRangeRule implements ScheduledChallengeProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: ScheduledChallengeProposal): string[] {
    const value = item.impressions;
    if (value < this.min || value > this.max) return [`impressions ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a scheduled challenge proposal. */
export class ScheduledChallengeProposalValidator {
  rules: ScheduledChallengeProposalRule[];

  constructor(rules: ScheduledChallengeProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ScheduledChallengeProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ScheduledChallengeProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ScheduledChallengeProposal[]): Map<string, string[]> {
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

export function defaultScheduledChallengeProposalValidator(): ScheduledChallengeProposalValidator {
  return new ScheduledChallengeProposalValidator(
    [
      new ScheduledChallengeProposalCodeLengthRule(16),
      new ScheduledChallengeProposalTitleLengthRule(80),
      new ScheduledChallengeProposalRequiredContactEmailRule("scheduled challenge proposal needs an entry"),
      new ScheduledChallengeProposalImpressionsRangeRule(1000, 3600),
    ],
  );
}
