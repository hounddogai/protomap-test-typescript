import * as text from "../../../../kit/text.js";
import { PayoutProposal } from "./payout-proposal.js";

/** A rule a payout proposal must pass. Check returns its problems, or none. */
export interface PayoutProposalRule {
  check(item: PayoutProposal): string[];
}

export class PayoutProposalExpiresAtRangeRule implements PayoutProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutProposal): string[] {
    const value = item.expiresAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`expires at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`expires at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutProposalCodeLengthRule implements PayoutProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PayoutProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PayoutProposalLimitRangeRule implements PayoutProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PayoutProposal): string[] {
    const value = item.limit;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`limit ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`limit ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PayoutProposalAllowedCodeRule implements PayoutProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PayoutProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

/** Runs every rule of a payout proposal. */
export class PayoutProposalValidator {
  rules: PayoutProposalRule[];

  constructor(rules: PayoutProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PayoutProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PayoutProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PayoutProposal[]): Map<string, string[]> {
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

export function defaultPayoutProposalValidator(): PayoutProposalValidator {
  return new PayoutProposalValidator(
    [
      new PayoutProposalExpiresAtRangeRule(32, 1000),
      new PayoutProposalCodeLengthRule(255),
      new PayoutProposalLimitRangeRule(1000, 86400),
      new PayoutProposalAllowedCodeRule(["rolling", "weighted", "legacy"]),
    ],
  );
}
