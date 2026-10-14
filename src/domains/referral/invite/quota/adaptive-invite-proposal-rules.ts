import { AdaptiveInviteProposal } from "./adaptive-invite-proposal.js";

/** A rule a adaptive invite proposal must pass. Check returns its problems, or none. */
export interface AdaptiveInviteProposalRule {
  check(item: AdaptiveInviteProposal): string[];
}

export class AdaptiveInviteProposalDurationMinutesRangeRule implements AdaptiveInviteProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveInviteProposal): string[] {
    const value = item.durationMinutes;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`duration minutes ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`duration minutes ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveInviteProposalRequiredTitleRule implements AdaptiveInviteProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveInviteProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveInviteProposalTitleLengthRule implements AdaptiveInviteProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveInviteProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive invite proposal. */
export class AdaptiveInviteProposalValidator {
  rules: AdaptiveInviteProposalRule[];

  constructor(rules: AdaptiveInviteProposalRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveInviteProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveInviteProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveInviteProposal[]): Map<string, string[]> {
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

export function defaultAdaptiveInviteProposalValidator(): AdaptiveInviteProposalValidator {
  return new AdaptiveInviteProposalValidator(
    [
      new AdaptiveInviteProposalDurationMinutesRangeRule(120, 255),
      new AdaptiveInviteProposalRequiredTitleRule("adaptive invite proposal needs an entry"),
      new AdaptiveInviteProposalTitleLengthRule(120),
    ],
  );
}
