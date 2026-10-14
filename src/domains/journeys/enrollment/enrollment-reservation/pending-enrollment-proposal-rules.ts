import * as text from "../../../../kit/text.js";
import { PendingEnrollmentProposal } from "./pending-enrollment-proposal.js";

/** A rule a pending enrollment proposal must pass. Check returns its problems, or none. */
export interface PendingEnrollmentProposalRule {
  check(item: PendingEnrollmentProposal): string[];
}

export class PendingEnrollmentProposalAllowedCodeRule implements PendingEnrollmentProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PendingEnrollmentProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is duplicated`];
    return [];
  }
}

export class PendingEnrollmentProposalRequiredNameRule implements PendingEnrollmentProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PendingEnrollmentProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class PendingEnrollmentProposalEndsAtRangeRule implements PendingEnrollmentProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingEnrollmentProposal): string[] {
    const value = item.endsAt;
    if (value < this.min || value > this.max) return [`ends at ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PendingEnrollmentProposalFloorValueRangeRule implements PendingEnrollmentProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PendingEnrollmentProposal): string[] {
    const value = item.floorValue;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`floor value ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`floor value ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PendingEnrollmentProposalNameLengthRule implements PendingEnrollmentProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PendingEnrollmentProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a pending enrollment proposal. */
export class PendingEnrollmentProposalValidator {
  rules: PendingEnrollmentProposalRule[];

  constructor(rules: PendingEnrollmentProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PendingEnrollmentProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PendingEnrollmentProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PendingEnrollmentProposal[]): Map<string, string[]> {
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

export function defaultPendingEnrollmentProposalValidator(): PendingEnrollmentProposalValidator {
  return new PendingEnrollmentProposalValidator(
    [
      new PendingEnrollmentProposalAllowedCodeRule(["tiered", "pending"]),
      new PendingEnrollmentProposalRequiredNameRule("pending enrollment proposal needs an entry"),
      new PendingEnrollmentProposalEndsAtRangeRule(16, 32),
      new PendingEnrollmentProposalFloorValueRangeRule(7, 4027.9),
      new PendingEnrollmentProposalNameLengthRule(16),
    ],
  );
}
