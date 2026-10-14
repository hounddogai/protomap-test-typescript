import { EnrollmentProposal } from "./enrollment-proposal.js";

/** A rule a enrollment proposal must pass. Check returns its problems, or none. */
export interface EnrollmentProposalRule {
  check(item: EnrollmentProposal): string[];
}

export class EnrollmentProposalWindowDaysRangeRule implements EnrollmentProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentProposal): string[] {
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

export class EnrollmentProposalCodePrefixRule implements EnrollmentProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: EnrollmentProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class EnrollmentProposalBidRangeRule implements EnrollmentProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EnrollmentProposal): string[] {
    const value = item.bid;
    if (value < this.min || value > this.max) return [`bid ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class EnrollmentProposalPinnedGuardRule implements EnrollmentProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: EnrollmentProposal): string[] {
    if (item.pinned && item.windowDays > this.limit) return [`window days ${item.windowDays} exceeds ${this.limit} while pinned`];
    return [];
  }
}

/** Runs every rule of a enrollment proposal. */
export class EnrollmentProposalValidator {
  rules: EnrollmentProposalRule[];

  constructor(rules: EnrollmentProposalRule[]) {
    this.rules = rules;
  }

  validate(item: EnrollmentProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: EnrollmentProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EnrollmentProposal[]): Map<string, string[]> {
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

export function defaultEnrollmentProposalValidator(): EnrollmentProposalValidator {
  return new EnrollmentProposalValidator(
    [
      new EnrollmentProposalWindowDaysRangeRule(32, 1000),
      new EnrollmentProposalCodePrefixRule("ACM"),
      new EnrollmentProposalBidRangeRule(2.5, 1099.4),
      new EnrollmentProposalPinnedGuardRule(80),
    ],
  );
}
