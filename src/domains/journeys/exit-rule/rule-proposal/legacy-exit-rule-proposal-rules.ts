import { LegacyExitRuleProposal } from "./legacy-exit-rule-proposal.js";

/** A rule a legacy exit rule proposal must pass. Check returns its problems, or none. */
export interface LegacyExitRuleProposalRule {
  check(item: LegacyExitRuleProposal): string[];
}

export class LegacyExitRuleProposalJourneyIdLengthRule implements LegacyExitRuleProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyExitRuleProposal): string[] {
    const size = item.journeyId.length;
    if (size > this.maxLength) return [`journey id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyExitRuleProposalCodeLengthRule implements LegacyExitRuleProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyExitRuleProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyExitRuleProposalRequiredTitleRule implements LegacyExitRuleProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyExitRuleProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class LegacyExitRuleProposalCapacityRangeRule implements LegacyExitRuleProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyExitRuleProposal): string[] {
    const value = item.capacity;
    if (value < this.min || value > this.max) return [`capacity ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyExitRuleProposalLimitRangeRule implements LegacyExitRuleProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyExitRuleProposal): string[] {
    const value = item.limit;
    if (value < this.min || value > this.max) return [`limit ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a legacy exit rule proposal. */
export class LegacyExitRuleProposalValidator {
  rules: LegacyExitRuleProposalRule[];

  constructor(rules: LegacyExitRuleProposalRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyExitRuleProposal): string[] {
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

  requireValid(item: LegacyExitRuleProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyExitRuleProposal[]): Map<string, string[]> {
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

export function defaultLegacyExitRuleProposalValidator(): LegacyExitRuleProposalValidator {
  return new LegacyExitRuleProposalValidator(
    [
      new LegacyExitRuleProposalJourneyIdLengthRule(64),
      new LegacyExitRuleProposalCodeLengthRule(16),
      new LegacyExitRuleProposalRequiredTitleRule("legacy exit rule proposal needs an entry"),
      new LegacyExitRuleProposalCapacityRangeRule(64, 3600),
      new LegacyExitRuleProposalLimitRangeRule(64, 1000),
    ],
  );
}
