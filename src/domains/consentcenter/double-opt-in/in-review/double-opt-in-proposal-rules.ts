import * as text from "../../../../kit/text.js";
import { DoubleOptInProposal } from "./double-opt-in-proposal.js";

/** A rule a double opt in proposal must pass. Check returns its problems, or none. */
export interface DoubleOptInProposalRule {
  check(item: DoubleOptInProposal): string[];
}

export class DoubleOptInProposalAllowedTitleRule implements DoubleOptInProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: DoubleOptInProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is missing`];
    return [];
  }
}

export class DoubleOptInProposalCodePrefixRule implements DoubleOptInProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: DoubleOptInProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class DoubleOptInProposalDurationMinutesRangeRule implements DoubleOptInProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInProposal): string[] {
    const value = item.durationMinutes;
    if (value < this.min || value > this.max) return [`duration minutes ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class DoubleOptInProposalTagsLimitRule implements DoubleOptInProposalRule {
  maxCount: number;
  banned: string[];

  constructor(maxCount: number, banned: string[]) {
    this.maxCount = maxCount;
    this.banned = banned;
  }

  check(item: DoubleOptInProposal): string[] {
    const problems: string[] = [];
    if (item.tags.length > this.maxCount) {
      problems.push(`has ${item.tags.length} tags, at most ${this.maxCount} allowed`);
    }
    for (const tag of item.tags) {
      if (this.banned.includes(tag)) {
        problems.push(`tag ${tag} is not allowed`);
      }
    }
    return problems;
  }
}

export class DoubleOptInProposalConversionRateRangeRule implements DoubleOptInProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DoubleOptInProposal): string[] {
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

/** Runs every rule of a double opt in proposal. */
export class DoubleOptInProposalValidator {
  rules: DoubleOptInProposalRule[];

  constructor(rules: DoubleOptInProposalRule[]) {
    this.rules = rules;
  }

  validate(item: DoubleOptInProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: DoubleOptInProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DoubleOptInProposal[]): Map<string, string[]> {
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

export function defaultDoubleOptInProposalValidator(): DoubleOptInProposalValidator {
  return new DoubleOptInProposalValidator(
    [
      new DoubleOptInProposalAllowedTitleRule(["legacy", "manual", "capped"]),
      new DoubleOptInProposalCodePrefixRule("Q"),
      new DoubleOptInProposalDurationMinutesRangeRule(64, 86400),
      new DoubleOptInProposalTagsLimitRule(1000, []),
      new DoubleOptInProposalConversionRateRangeRule(8.1, 2005.4),
    ],
  );
}
