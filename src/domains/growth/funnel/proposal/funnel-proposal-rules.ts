import { FunnelProposal } from "./funnel-proposal.js";

/** A rule a funnel proposal must pass. Check returns its problems, or none. */
export interface FunnelProposalRule {
  check(item: FunnelProposal): string[];
}

export class FunnelProposalRequiredChannelRule implements FunnelProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: FunnelProposal): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class FunnelProposalLabelLengthRule implements FunnelProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelProposalScoreRangeRule implements FunnelProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelProposal): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class FunnelProposalCodeLengthRule implements FunnelProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: FunnelProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class FunnelProposalMarginRangeRule implements FunnelProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: FunnelProposal): string[] {
    const value = item.margin;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`margin ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`margin ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a funnel proposal. */
export class FunnelProposalValidator {
  rules: FunnelProposalRule[];

  constructor(rules: FunnelProposalRule[]) {
    this.rules = rules;
  }

  validate(item: FunnelProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: FunnelProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: FunnelProposal[]): Map<string, string[]> {
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

export function defaultFunnelProposalValidator(): FunnelProposalValidator {
  return new FunnelProposalValidator(
    [
      new FunnelProposalRequiredChannelRule("funnel proposal needs an entry"),
      new FunnelProposalLabelLengthRule(32),
      new FunnelProposalScoreRangeRule(5.6, 3373.2),
      new FunnelProposalCodeLengthRule(1000),
      new FunnelProposalMarginRangeRule(2.5, 4579.3),
    ],
  );
}
