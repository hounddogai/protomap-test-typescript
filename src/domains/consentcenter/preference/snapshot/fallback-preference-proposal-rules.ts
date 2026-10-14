import { FallbackPreferenceProposal } from "./fallback-preference-proposal.js";

/** A rule a fallback preference proposal must pass. Check returns its problems, or none. */
export interface FallbackPreferenceProposalRule {
  check(item: FallbackPreferenceProposal): string[];
}

export class FallbackPreferenceProposalSequenceRangeRule implements FallbackPreferenceProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPreferenceProposal): string[] {
    const value = item.sequence;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`sequence ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`sequence ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPreferenceProposalUpdatedAtRangeRule implements FallbackPreferenceProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FallbackPreferenceProposal): string[] {
    const value = item.updatedAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`updated at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`updated at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FallbackPreferenceProposalChannelLengthRule implements FallbackPreferenceProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FallbackPreferenceProposal): string[] {
    const size = item.channel.length;
    if (size > this.maxLength) return [`channel is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FallbackPreferenceProposalRequiredTitleRule implements FallbackPreferenceProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FallbackPreferenceProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a fallback preference proposal. */
export class FallbackPreferenceProposalValidator {
  rules: FallbackPreferenceProposalRule[];

  constructor(rules: FallbackPreferenceProposalRule[]) {
    this.rules = rules;
  }

  validate(item: FallbackPreferenceProposal): string[] {
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

  requireValid(item: FallbackPreferenceProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FallbackPreferenceProposal[]): Map<string, string[]> {
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

export function defaultFallbackPreferenceProposalValidator(): FallbackPreferenceProposalValidator {
  return new FallbackPreferenceProposalValidator(
    [
      new FallbackPreferenceProposalSequenceRangeRule(64, 120),
      new FallbackPreferenceProposalUpdatedAtRangeRule(32, 3600),
      new FallbackPreferenceProposalChannelLengthRule(16),
      new FallbackPreferenceProposalRequiredTitleRule("fallback preference proposal needs an entry"),
    ],
  );
}
