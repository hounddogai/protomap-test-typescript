import * as text from "../../../../kit/text.js";
import { ChallengeProposal } from "./challenge-proposal.js";

/** A rule a challenge proposal must pass. Check returns its problems, or none. */
export interface ChallengeProposalRule {
  check(item: ChallengeProposal): string[];
}

export class ChallengeProposalRequiredLabelRule implements ChallengeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ChallengeProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class ChallengeProposalAllowedDescriptionRule implements ChallengeProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ChallengeProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.description))) return [`description ${item.description} is blocked`];
    return [];
  }
}

export class ChallengeProposalTitleLengthRule implements ChallengeProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class ChallengeProposalLabelLengthRule implements ChallengeProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: ChallengeProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a challenge proposal. */
export class ChallengeProposalValidator {
  rules: ChallengeProposalRule[];

  constructor(rules: ChallengeProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ChallengeProposal): string[] {
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

  requireValid(item: ChallengeProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ChallengeProposal[]): Map<string, string[]> {
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

export function defaultChallengeProposalValidator(): ChallengeProposalValidator {
  return new ChallengeProposalValidator(
    [
      new ChallengeProposalRequiredLabelRule("challenge proposal needs an entry"),
      new ChallengeProposalAllowedDescriptionRule(["pending", "tiered"]),
      new ChallengeProposalTitleLengthRule(80),
      new ChallengeProposalLabelLengthRule(64),
    ],
  );
}
