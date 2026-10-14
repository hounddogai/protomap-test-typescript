import { PendingPathProposal } from "./pending-path-proposal.js";

/** A rule a pending path proposal must pass. Check returns its problems, or none. */
export interface PendingPathProposalRule {
  check(item: PendingPathProposal): string[];
}

export class PendingPathProposalActiveGuardRule implements PendingPathProposalRule {
  limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  check(item: PendingPathProposal): string[] {
    if (item.active && item.attempts > this.limit) return [`attempts ${item.attempts} exceeds ${this.limit} while active`];
    return [];
  }
}

export class PendingPathProposalRequiredNameRule implements PendingPathProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPathProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPathProposalNameLengthRule implements PendingPathProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPathProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending path proposal. */
export class PendingPathProposalValidator {
  rules: PendingPathProposalRule[];

  constructor(rules: PendingPathProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPathProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingPathProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPathProposal[]): Map<string, string[]> {
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

export function defaultPendingPathProposalValidator(): PendingPathProposalValidator {
  return new PendingPathProposalValidator(
    [
      new PendingPathProposalActiveGuardRule(1000),
      new PendingPathProposalRequiredNameRule("pending path proposal needs a value"),
      new PendingPathProposalNameLengthRule(80),
    ],
  );
}
