import { GlobalChallengeProposal } from "./global-challenge-proposal.js";

/** A rule a global challenge proposal must pass. Check returns its problems, or none. */
export interface GlobalChallengeProposalRule {
  check(item: GlobalChallengeProposal): string[];
}

export class GlobalChallengeProposalCodePrefixRule implements GlobalChallengeProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: GlobalChallengeProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class GlobalChallengeProposalBudgetRangeRule implements GlobalChallengeProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalChallengeProposal): string[] {
    const value = item.budget;
    if (value < this.min || value > this.max) return [`budget ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class GlobalChallengeProposalRequiredUnitRule implements GlobalChallengeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalChallengeProposal): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a global challenge proposal. */
export class GlobalChallengeProposalValidator {
  rules: GlobalChallengeProposalRule[];

  constructor(rules: GlobalChallengeProposalRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalChallengeProposal): string[] {
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

  requireValid(item: GlobalChallengeProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalChallengeProposal[]): Map<string, string[]> {
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

export function defaultGlobalChallengeProposalValidator(): GlobalChallengeProposalValidator {
  return new GlobalChallengeProposalValidator(
    [
      new GlobalChallengeProposalCodePrefixRule("X"),
      new GlobalChallengeProposalBudgetRangeRule(6.8, 2256.2),
      new GlobalChallengeProposalRequiredUnitRule("global challenge proposal needs this field"),
    ],
  );
}
