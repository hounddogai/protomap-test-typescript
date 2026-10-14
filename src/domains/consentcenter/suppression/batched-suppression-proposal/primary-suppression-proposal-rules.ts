import * as text from "../../../../kit/text.js";
import { PrimarySuppressionProposal } from "./primary-suppression-proposal.js";

/** A rule a primary suppression proposal must pass. Check returns its problems, or none. */
export interface PrimarySuppressionProposalRule {
  check(item: PrimarySuppressionProposal): string[];
}

export class PrimarySuppressionProposalLabelLengthRule implements PrimarySuppressionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimarySuppressionProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimarySuppressionProposalRequiredNotesRule implements PrimarySuppressionProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySuppressionProposal): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class PrimarySuppressionProposalExpiresAtRangeRule implements PrimarySuppressionProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimarySuppressionProposal): string[] {
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

export class PrimarySuppressionProposalAllowedNotesRule implements PrimarySuppressionProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimarySuppressionProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.notes))) return [`notes ${item.notes} is not allowed`];
    return [];
  }
}

export class PrimarySuppressionProposalCodePrefixRule implements PrimarySuppressionProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimarySuppressionProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PrimarySuppressionProposalRequiredLabelRule implements PrimarySuppressionProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PrimarySuppressionProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a primary suppression proposal. */
export class PrimarySuppressionProposalValidator {
  rules: PrimarySuppressionProposalRule[];

  constructor(rules: PrimarySuppressionProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PrimarySuppressionProposal): string[] {
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

  requireValid(item: PrimarySuppressionProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimarySuppressionProposal[]): Map<string, string[]> {
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

export function defaultPrimarySuppressionProposalValidator(): PrimarySuppressionProposalValidator {
  return new PrimarySuppressionProposalValidator(
    [
      new PrimarySuppressionProposalLabelLengthRule(1000),
      new PrimarySuppressionProposalRequiredNotesRule("primary suppression proposal needs this field"),
      new PrimarySuppressionProposalExpiresAtRangeRule(120, 1000),
      new PrimarySuppressionProposalAllowedNotesRule([]),
      new PrimarySuppressionProposalCodePrefixRule("REF"),
      new PrimarySuppressionProposalRequiredLabelRule("primary suppression proposal needs an entry"),
    ],
  );
}
