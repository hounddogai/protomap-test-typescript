import { DomainProposal } from "./domain-proposal.js";

/** A rule a domain proposal must pass. Check returns its problems, or none. */
export interface DomainProposalRule {
  check(item: DomainProposal): string[];
}

export class DomainProposalRequiredTitleRule implements DomainProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class DomainProposalWindowDaysRangeRule implements DomainProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: DomainProposal): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class DomainProposalRequiredSourceRule implements DomainProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: DomainProposal): string[] {
    if (item.source.trim() === "") return [this.message];
    return [];
  }
}

export class DomainProposalPinnedGuardRule implements DomainProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: DomainProposal): string[] {
    if (item.pinned && item.threshold > this.limit) return [`threshold ${item.threshold} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a domain proposal. */
export class DomainProposalValidator {
  rules: DomainProposalRule[];

  constructor(rules: DomainProposalRule[]) {
    this.rules = rules;
  }

  validate(item: DomainProposal): string[] {
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

  requireValid(item: DomainProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: DomainProposal[]): Map<string, string[]> {
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

export function defaultDomainProposalValidator(): DomainProposalValidator {
  return new DomainProposalValidator(
    [
      new DomainProposalRequiredTitleRule("domain proposal needs an entry"),
      new DomainProposalWindowDaysRangeRule(80, 120),
      new DomainProposalRequiredSourceRule("domain proposal needs a value"),
      new DomainProposalPinnedGuardRule(7.3),
    ],
  );
}
