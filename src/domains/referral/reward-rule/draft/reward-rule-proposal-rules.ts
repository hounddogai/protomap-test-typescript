import * as text from "../../../../kit/text.js";
import { RewardRuleProposal } from "./reward-rule-proposal.js";

/** A rule a reward rule proposal must pass. Check returns its problems, or none. */
export interface RewardRuleProposalRule {
  check(item: RewardRuleProposal): string[];
}

export class RewardRuleProposalMaximumRangeRule implements RewardRuleProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleProposal): string[] {
    const value = item.maximum;
    if (value < this.min || value > this.max) return [`maximum ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class RewardRuleProposalAllowedTitleRule implements RewardRuleProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RewardRuleProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is stale`];
    return [];
  }
}

export class RewardRuleProposalRequiredPhoneRule implements RewardRuleProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RewardRuleProposal): string[] {
    if (item.phone.trim() === "") return [this.message];
    return [];
  }
}

export class RewardRuleProposalBidRangeRule implements RewardRuleProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RewardRuleProposal): string[] {
    const value = item.bid;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`bid ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`bid ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RewardRuleProposalTitleLengthRule implements RewardRuleProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleProposal): string[] {
    const size = item.title.length;
    if (size > this.maxLength) return [`title is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RewardRuleProposalCountryLengthRule implements RewardRuleProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RewardRuleProposal): string[] {
    const size = item.country.length;
    if (size > this.maxLength) return [`country is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a reward rule proposal. */
export class RewardRuleProposalValidator {
  rules: RewardRuleProposalRule[];

  constructor(rules: RewardRuleProposalRule[]) {
    this.rules = rules;
  }

  validate(item: RewardRuleProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: RewardRuleProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RewardRuleProposal[]): Map<string, string[]> {
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

export function defaultRewardRuleProposalValidator(): RewardRuleProposalValidator {
  return new RewardRuleProposalValidator(
    [
      new RewardRuleProposalMaximumRangeRule(1.1, 1908.8),
      new RewardRuleProposalAllowedTitleRule([]),
      new RewardRuleProposalRequiredPhoneRule("reward rule proposal needs this field"),
      new RewardRuleProposalBidRangeRule(3.8, 801.4),
      new RewardRuleProposalTitleLengthRule(120),
      new RewardRuleProposalCountryLengthRule(120),
    ],
  );
}
