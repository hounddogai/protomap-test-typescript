import { AdaptiveRewardRuleProposal } from "./adaptive-reward-rule-proposal.js";

/** A rule a adaptive reward rule proposal must pass. Check returns its problems, or none. */
export interface AdaptiveRewardRuleProposalRule {
  check(item: AdaptiveRewardRuleProposal): string[];
}

export class AdaptiveRewardRuleProposalOwnerIdLengthRule implements AdaptiveRewardRuleProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRewardRuleProposal): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveRewardRuleProposalRequiredCodeRule implements AdaptiveRewardRuleProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveRewardRuleProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveRewardRuleProposalRequiredNameRule implements AdaptiveRewardRuleProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveRewardRuleProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveRewardRuleProposalCodeLengthRule implements AdaptiveRewardRuleProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveRewardRuleProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveRewardRuleProposalClicksRangeRule implements AdaptiveRewardRuleProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveRewardRuleProposal): string[] {
    const value = item.clicks;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`clicks ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`clicks ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a adaptive reward rule proposal. */
export class AdaptiveRewardRuleProposalValidator {
  rules: AdaptiveRewardRuleProposalRule[];

  constructor(rules: AdaptiveRewardRuleProposalRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveRewardRuleProposal): string[] {
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

  requireValid(item: AdaptiveRewardRuleProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveRewardRuleProposal[]): Map<string, string[]> {
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

export function defaultAdaptiveRewardRuleProposalValidator(): AdaptiveRewardRuleProposalValidator {
  return new AdaptiveRewardRuleProposalValidator(
    [
      new AdaptiveRewardRuleProposalOwnerIdLengthRule(16),
      new AdaptiveRewardRuleProposalRequiredCodeRule("adaptive reward rule proposal needs an entry"),
      new AdaptiveRewardRuleProposalRequiredNameRule("adaptive reward rule proposal needs an entry"),
      new AdaptiveRewardRuleProposalCodeLengthRule(64),
      new AdaptiveRewardRuleProposalClicksRangeRule(16, 1000),
    ],
  );
}
