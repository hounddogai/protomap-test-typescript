import { BounceProposal } from "./bounce-proposal.js";

/** A rule a bounce proposal must pass. Check returns its problems, or none. */
export interface BounceProposalRule {
  check(item: BounceProposal): string[];
}

export class BounceProposalLabelLengthRule implements BounceProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceProposalCodePrefixRule implements BounceProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BounceProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BounceProposalRateRangeRule implements BounceProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BounceProposal): string[] {
    const value = item.rate;
    if (value < this.min || value > this.max) return [`rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BounceProposalCategoryLengthRule implements BounceProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BounceProposal): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BounceProposalRequiredCategoryRule implements BounceProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BounceProposal): string[] {
    if (item.category.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a bounce proposal. */
export class BounceProposalValidator {
  rules: BounceProposalRule[];

  constructor(rules: BounceProposalRule[]) {
    this.rules = rules;
  }

  validate(item: BounceProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BounceProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BounceProposal[]): Map<string, string[]> {
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

export function defaultBounceProposalValidator(): BounceProposalValidator {
  return new BounceProposalValidator(
    [
      new BounceProposalLabelLengthRule(86400),
      new BounceProposalCodePrefixRule("Q"),
      new BounceProposalRateRangeRule(9.2, 1854.3),
      new BounceProposalCategoryLengthRule(64),
      new BounceProposalRequiredCategoryRule("bounce proposal needs a value"),
    ],
  );
}
