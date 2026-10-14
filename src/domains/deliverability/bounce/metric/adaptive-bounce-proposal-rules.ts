import * as text from "../../../../kit/text.js";
import { AdaptiveBounceProposal } from "./adaptive-bounce-proposal.js";

/** A rule a adaptive bounce proposal must pass. Check returns its problems, or none. */
export interface AdaptiveBounceProposalRule {
  check(item: AdaptiveBounceProposal): string[];
}

export class AdaptiveBounceProposalRetriesRangeRule implements AdaptiveBounceProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveBounceProposal): string[] {
    const value = item.retries;
    if (value < this.min || value > this.max) return [`retries ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class AdaptiveBounceProposalAllowedTitleRule implements AdaptiveBounceProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveBounceProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is not allowed`];
    return [];
  }
}

export class AdaptiveBounceProposalLimitRangeRule implements AdaptiveBounceProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveBounceProposal): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveBounceProposalCodeLengthRule implements AdaptiveBounceProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveBounceProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveBounceProposalRequiredTitleRule implements AdaptiveBounceProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveBounceProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a adaptive bounce proposal. */
export class AdaptiveBounceProposalValidator {
  rules: AdaptiveBounceProposalRule[];

  constructor(rules: AdaptiveBounceProposalRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveBounceProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: AdaptiveBounceProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveBounceProposal[]): Map<string, string[]> {
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

export function defaultAdaptiveBounceProposalValidator(): AdaptiveBounceProposalValidator {
  return new AdaptiveBounceProposalValidator(
    [
      new AdaptiveBounceProposalRetriesRangeRule(32, 255),
      new AdaptiveBounceProposalAllowedTitleRule(["tiered"]),
      new AdaptiveBounceProposalLimitRangeRule(1000, 86400),
      new AdaptiveBounceProposalCodeLengthRule(120),
      new AdaptiveBounceProposalRequiredTitleRule("adaptive bounce proposal needs a value"),
    ],
  );
}
