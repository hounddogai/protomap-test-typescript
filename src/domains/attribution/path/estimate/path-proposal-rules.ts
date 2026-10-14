import { PathProposal } from "./path-proposal.js";

/** A rule a path proposal must pass. Check returns its problems, or none. */
export interface PathProposalRule {
  check(item: PathProposal): string[];
}

export class PathProposalArchivedGuardRule implements PathProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PathProposal): string[] {
    if (item.archived && item.graceDays > this.limit) return [`grace days ${item.graceDays} exceeds ${this.limit} while archived`];
    return [];
  }
}

export class PathProposalCodePrefixRule implements PathProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PathProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PathProposalGraceDaysRangeRule implements PathProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PathProposal): string[] {
    const value = item.graceDays;
    if (value < this.min || value > this.max) return [`grace days ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a path proposal. */
export class PathProposalValidator {
  rules: PathProposalRule[];

  constructor(rules: PathProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PathProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PathProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PathProposal[]): Map<string, string[]> {
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

export function defaultPathProposalValidator(): PathProposalValidator {
  return new PathProposalValidator(
    [
      new PathProposalArchivedGuardRule(255),
      new PathProposalCodePrefixRule("REF"),
      new PathProposalGraceDaysRangeRule(80, 255),
    ],
  );
}
