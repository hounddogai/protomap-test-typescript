import { TieredSubscriptionProposal } from "./tiered-subscription-proposal.js";

/** A rule a tiered subscription proposal must pass. Check returns its problems, or none. */
export interface TieredSubscriptionProposalRule {
  check(item: TieredSubscriptionProposal): string[];
}

export class TieredSubscriptionProposalVariantLengthRule implements TieredSubscriptionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: TieredSubscriptionProposal): string[] {
    const size = item.variant.length;
    if (size > this.maxLength) return [`variant is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class TieredSubscriptionProposalExpiresAtRangeRule implements TieredSubscriptionProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: TieredSubscriptionProposal): string[] {
    const value = item.expiresAt;
    if (value < this.min || value > this.max) return [`expires at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class TieredSubscriptionProposalRequiredSummaryRule implements TieredSubscriptionProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: TieredSubscriptionProposal): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a tiered subscription proposal. */
export class TieredSubscriptionProposalValidator {
  rules: TieredSubscriptionProposalRule[];

  constructor(rules: TieredSubscriptionProposalRule[]) {
    this.rules = rules;
  }

  validate(item: TieredSubscriptionProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: TieredSubscriptionProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: TieredSubscriptionProposal[]): Map<string, string[]> {
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

export function defaultTieredSubscriptionProposalValidator(): TieredSubscriptionProposalValidator {
  return new TieredSubscriptionProposalValidator(
    [
      new TieredSubscriptionProposalVariantLengthRule(1000),
      new TieredSubscriptionProposalExpiresAtRangeRule(32, 80),
      new TieredSubscriptionProposalRequiredSummaryRule("tiered subscription proposal needs a value"),
    ],
  );
}
