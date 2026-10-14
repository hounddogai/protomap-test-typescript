import * as text from "../../../../kit/text.js";
import { SeasonalMacroProposal } from "./seasonal-macro-proposal.js";

/** A rule a seasonal macro proposal must pass. Check returns its problems, or none. */
export interface SeasonalMacroProposalRule {
  check(item: SeasonalMacroProposal): string[];
}

export class SeasonalMacroProposalBudgetRangeRule implements SeasonalMacroProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: SeasonalMacroProposal): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class SeasonalMacroProposalRequiredChannelRule implements SeasonalMacroProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMacroProposal): string[] {
    if (item.channel.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalMacroProposalRequiredCodeRule implements SeasonalMacroProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMacroProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class SeasonalMacroProposalAllowedCountryRule implements SeasonalMacroProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalMacroProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.country))) return [`country ${item.country} is unknown`];
    return [];
  }
}

export class SeasonalMacroProposalRequiredNameRule implements SeasonalMacroProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalMacroProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal macro proposal. */
export class SeasonalMacroProposalValidator {
  rules: SeasonalMacroProposalRule[];

  constructor(rules: SeasonalMacroProposalRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalMacroProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: SeasonalMacroProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalMacroProposal[]): Map<string, string[]> {
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

export function defaultSeasonalMacroProposalValidator(): SeasonalMacroProposalValidator {
  return new SeasonalMacroProposalValidator(
    [
      new SeasonalMacroProposalBudgetRangeRule(8.5, 2498.6),
      new SeasonalMacroProposalRequiredChannelRule("seasonal macro proposal needs an entry"),
      new SeasonalMacroProposalRequiredCodeRule("seasonal macro proposal needs a value"),
      new SeasonalMacroProposalAllowedCountryRule(["primary"]),
      new SeasonalMacroProposalRequiredNameRule("seasonal macro proposal needs this field"),
    ],
  );
}
