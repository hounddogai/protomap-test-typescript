import { LenientCreditProposal } from "./lenient-credit-proposal.js";

/** A rule a lenient credit proposal must pass. Check returns its problems, or none. */
export interface LenientCreditProposalRule {
  check(item: LenientCreditProposal): string[];
}

export class LenientCreditProposalRequiredCohortRule implements LenientCreditProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCreditProposal): string[] {
    if (item.cohort.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCreditProposalRequiredCodeRule implements LenientCreditProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCreditProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCreditProposalOpenRateRangeRule implements LenientCreditProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCreditProposal): string[] {
    const value = item.openRate;
    if (value < this.min || value > this.max) return [`open rate ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientCreditProposalRequiredTitleRule implements LenientCreditProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientCreditProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LenientCreditProposalTitleLengthRule implements LenientCreditProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LenientCreditProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LenientCreditProposalAmountRangeRule implements LenientCreditProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientCreditProposal): string[] {
    const value = item.amount;
    if (value < this.min || value > this.max) return [`amount ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a lenient credit proposal. */
export class LenientCreditProposalValidator {
  rules: LenientCreditProposalRule[];

  constructor(rules: LenientCreditProposalRule[]) {
    this.rules = rules;
  }

  validate(item: LenientCreditProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: LenientCreditProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientCreditProposal[]): Map<string, string[]> {
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

export function defaultLenientCreditProposalValidator(): LenientCreditProposalValidator {
  return new LenientCreditProposalValidator(
    [
      new LenientCreditProposalRequiredCohortRule("lenient credit proposal needs an entry"),
      new LenientCreditProposalRequiredCodeRule("lenient credit proposal needs this field"),
      new LenientCreditProposalOpenRateRangeRule(4.6, 3428.8),
      new LenientCreditProposalRequiredTitleRule("lenient credit proposal needs this field"),
      new LenientCreditProposalTitleLengthRule(3600),
      new LenientCreditProposalAmountRangeRule(2.9, 3074.6),
    ],
  );
}
