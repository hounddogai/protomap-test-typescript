import { PendingFrequencyProposal } from "./pending-frequency-proposal.js";

/** A rule a pending frequency proposal must pass. Check returns its problems, or none. */
export interface PendingFrequencyProposalRule {
  check(item: PendingFrequencyProposal): string[];
}

export class PendingFrequencyProposalSummaryLengthRule implements PendingFrequencyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFrequencyProposal): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFrequencyProposalChannelLengthRule implements PendingFrequencyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFrequencyProposal): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFrequencyProposalCodeLengthRule implements PendingFrequencyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingFrequencyProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingFrequencyProposalRequiredNameRule implements PendingFrequencyProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingFrequencyProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingFrequencyProposalCeilingRangeRule implements PendingFrequencyProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingFrequencyProposal): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending frequency proposal. */
export class PendingFrequencyProposalValidator {
  rules: PendingFrequencyProposalRule[];

  constructor(rules: PendingFrequencyProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PendingFrequencyProposal): string[] {
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

  requireValid(item: PendingFrequencyProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingFrequencyProposal[]): Map<string, string[]> {
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

export function defaultPendingFrequencyProposalValidator(): PendingFrequencyProposalValidator {
  return new PendingFrequencyProposalValidator(
    [
      new PendingFrequencyProposalSummaryLengthRule(80),
      new PendingFrequencyProposalChannelLengthRule(3600),
      new PendingFrequencyProposalCodeLengthRule(80),
      new PendingFrequencyProposalRequiredNameRule("pending frequency proposal needs this field"),
      new PendingFrequencyProposalCeilingRangeRule(0.6, 2553.1),
    ],
  );
}
