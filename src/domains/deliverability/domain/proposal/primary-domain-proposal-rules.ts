import * as text from "../../../../kit/text.js";
import { PrimaryDomainProposal } from "./primary-domain-proposal.js";

/** A rule a primary domain proposal must pass. Check returns its problems, or none. */
export interface PrimaryDomainProposalRule {
  check(item: PrimaryDomainProposal): string[];
}

export class PrimaryDomainProposalRequiredLabelRule implements PrimaryDomainProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimaryDomainProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class PrimaryDomainProposalEndsAtRangeRule implements PrimaryDomainProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryDomainProposal): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class PrimaryDomainProposalAllowedLabelRule implements PrimaryDomainProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryDomainProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is too long`];
    return [];
  }
}

export class PrimaryDomainProposalCodeLengthRule implements PrimaryDomainProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryDomainProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a primary domain proposal. */
export class PrimaryDomainProposalValidator {
  rules: PrimaryDomainProposalRule[];

  constructor(rules: PrimaryDomainProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryDomainProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PrimaryDomainProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryDomainProposal[]): Map<string, string[]> {
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

export function defaultPrimaryDomainProposalValidator(): PrimaryDomainProposalValidator {
  return new PrimaryDomainProposalValidator(
    [
      new PrimaryDomainProposalRequiredLabelRule("primary domain proposal needs this field"),
      new PrimaryDomainProposalEndsAtRangeRule(32, 86400),
      new PrimaryDomainProposalAllowedLabelRule([]),
      new PrimaryDomainProposalCodeLengthRule(3600),
    ],
  );
}
