import { DefaultReplyProposal } from "./default-reply-proposal.js";

/** A rule a default reply proposal must pass. Check returns its problems, or none. */
export interface DefaultReplyProposalRule {
  check(item: DefaultReplyProposal): string[];
}

export class DefaultReplyProposalCodePrefixRule implements DefaultReplyProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DefaultReplyProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DefaultReplyProposalConversionRateRangeRule implements DefaultReplyProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DefaultReplyProposal): string[] {
    const value = item.conversionRate;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`conversion rate ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`conversion rate ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DefaultReplyProposalSegmentLengthRule implements DefaultReplyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: DefaultReplyProposal): string[] {
    const size = item.segment.length;
    if (size > this.maxLength) return [`segment is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a default reply proposal. */
export class DefaultReplyProposalValidator {
  rules: DefaultReplyProposalRule[];

  constructor(rules: DefaultReplyProposalRule[]) {
    this.rules = rules;
  }

  validate(item: DefaultReplyProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DefaultReplyProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DefaultReplyProposal[]): Map<string, string[]> {
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

export function defaultDefaultReplyProposalValidator(): DefaultReplyProposalValidator {
  return new DefaultReplyProposalValidator(
    [
      new DefaultReplyProposalCodePrefixRule("Q"),
      new DefaultReplyProposalConversionRateRangeRule(5.3, 4599),
      new DefaultReplyProposalSegmentLengthRule(86400),
    ],
  );
}
