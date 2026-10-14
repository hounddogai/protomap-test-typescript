import { BadgeProposal } from "./badge-proposal.js";

/** A rule a badge proposal must pass. Check returns its problems, or none. */
export interface BadgeProposalRule {
  check(item: BadgeProposal): string[];
}

export class BadgeProposalRequiredTitleRule implements BadgeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: BadgeProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class BadgeProposalCodePrefixRule implements BadgeProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: BadgeProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class BadgeProposalCodeLengthRule implements BadgeProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: BadgeProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class BadgeProposalCreatedAtRangeRule implements BadgeProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeProposal): string[] {
    const value = item.createdAt;
    if (value < this.min || value > this.max) return [`created at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class BadgeProposalAttemptsRangeRule implements BadgeProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: BadgeProposal): string[] {
    const value = item.attempts;
    if (value < this.min || value > this.max) return [`attempts ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a badge proposal. */
export class BadgeProposalValidator {
  rules: BadgeProposalRule[];

  constructor(rules: BadgeProposalRule[]) {
    this.rules = rules;
  }

  validate(item: BadgeProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: BadgeProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: BadgeProposal[]): Map<string, string[]> {
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

export function defaultBadgeProposalValidator(): BadgeProposalValidator {
  return new BadgeProposalValidator(
    [
      new BadgeProposalRequiredTitleRule("badge proposal needs an entry"),
      new BadgeProposalCodePrefixRule("X"),
      new BadgeProposalCodeLengthRule(86400),
      new BadgeProposalCreatedAtRangeRule(16, 16),
      new BadgeProposalAttemptsRangeRule(80, 3600),
    ],
  );
}
