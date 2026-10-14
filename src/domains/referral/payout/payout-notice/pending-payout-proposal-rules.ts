import * as text from "../../../../kit/text.js";
import { PendingPayoutProposal } from "./pending-payout-proposal.js";

/** A rule a pending payout proposal must pass. Check returns its problems, or none. */
export interface PendingPayoutProposalRule {
  check(item: PendingPayoutProposal): string[];
}

export class PendingPayoutProposalOwnerIdLengthRule implements PendingPayoutProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPayoutProposal): string[] {
    const size = item.ownerId.length;
    if (size > this.maxLength) return [`owner id is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPayoutProposalNameLengthRule implements PendingPayoutProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingPayoutProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PendingPayoutProposalAllowedLocaleRule implements PendingPayoutProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingPayoutProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.locale))) return [`locale ${item.locale} is inconsistent`];
    return [];
  }
}

export class PendingPayoutProposalRequiredNameRule implements PendingPayoutProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingPayoutProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingPayoutProposalWeightRangeRule implements PendingPayoutProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingPayoutProposal): string[] {
    const value = item.weight;
    if (value < this.min || value > this.max) return [`weight ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

/** Runs every rule of a pending payout proposal. */
export class PendingPayoutProposalValidator {
  rules: PendingPayoutProposalRule[];

  constructor(rules: PendingPayoutProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PendingPayoutProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingPayoutProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingPayoutProposal[]): Map<string, string[]> {
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

export function defaultPendingPayoutProposalValidator(): PendingPayoutProposalValidator {
  return new PendingPayoutProposalValidator(
    [
      new PendingPayoutProposalOwnerIdLengthRule(64),
      new PendingPayoutProposalNameLengthRule(1000),
      new PendingPayoutProposalAllowedLocaleRule(["regional", "legacy"]),
      new PendingPayoutProposalRequiredNameRule("pending payout proposal needs an entry"),
      new PendingPayoutProposalWeightRangeRule(7.8, 496.6),
    ],
  );
}
