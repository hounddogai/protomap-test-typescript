import * as text from "../../../../kit/text.js";
import { PendingInviteProposal } from "./pending-invite-proposal.js";

/** A rule a pending invite proposal must pass. Check returns its problems, or none. */
export interface PendingInviteProposalRule {
  check(item: PendingInviteProposal): string[];
}

export class PendingInviteProposalConversionRateRangeRule implements PendingInviteProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingInviteProposal): string[] {
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

export class PendingInviteProposalAllowedTitleRule implements PendingInviteProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingInviteProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.title))) return [`title ${item.title} is too long`];
    return [];
  }
}

export class PendingInviteProposalCategoryLengthRule implements PendingInviteProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingInviteProposal): string[] {
    const size = item.category.length;
    if (size > this.maxLength) return [`category is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending invite proposal. */
export class PendingInviteProposalValidator {
  rules: PendingInviteProposalRule[];

  constructor(rules: PendingInviteProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PendingInviteProposal): string[] {
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

  requireValid(item: PendingInviteProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingInviteProposal[]): Map<string, string[]> {
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

export function defaultPendingInviteProposalValidator(): PendingInviteProposalValidator {
  return new PendingInviteProposalValidator(
    [
      new PendingInviteProposalConversionRateRangeRule(3.2, 3097),
      new PendingInviteProposalAllowedTitleRule(["strict"]),
      new PendingInviteProposalCategoryLengthRule(80),
    ],
  );
}
