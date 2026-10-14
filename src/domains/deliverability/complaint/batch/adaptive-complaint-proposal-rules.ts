import * as text from "../../../../kit/text.js";
import { AdaptiveComplaintProposal } from "./adaptive-complaint-proposal.js";

/** A rule a adaptive complaint proposal must pass. Check returns its problems, or none. */
export interface AdaptiveComplaintProposalRule {
  check(item: AdaptiveComplaintProposal): string[];
}

export class AdaptiveComplaintProposalGraceDaysRangeRule implements AdaptiveComplaintProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: AdaptiveComplaintProposal): string[] {
    const value = item.graceDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`grace days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`grace days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class AdaptiveComplaintProposalRequiredLocaleRule implements AdaptiveComplaintProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: AdaptiveComplaintProposal): string[] {
    if (item.locale.trim() === "") return [this.message];
    return [];
  }
}

export class AdaptiveComplaintProposalCodeLengthRule implements AdaptiveComplaintProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class AdaptiveComplaintProposalAllowedLabelRule implements AdaptiveComplaintProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: AdaptiveComplaintProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is unknown`];
    return [];
  }
}

export class AdaptiveComplaintProposalCodePrefixRule implements AdaptiveComplaintProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: AdaptiveComplaintProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class AdaptiveComplaintProposalLabelLengthRule implements AdaptiveComplaintProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: AdaptiveComplaintProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a adaptive complaint proposal. */
export class AdaptiveComplaintProposalValidator {
  rules: AdaptiveComplaintProposalRule[];

  constructor(rules: AdaptiveComplaintProposalRule[]) {
    this.rules = rules;
  }

  validate(item: AdaptiveComplaintProposal): string[] {
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

  requireValid(item: AdaptiveComplaintProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: AdaptiveComplaintProposal[]): Map<string, string[]> {
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

export function defaultAdaptiveComplaintProposalValidator(): AdaptiveComplaintProposalValidator {
  return new AdaptiveComplaintProposalValidator(
    [
      new AdaptiveComplaintProposalGraceDaysRangeRule(80, 1000),
      new AdaptiveComplaintProposalRequiredLocaleRule("adaptive complaint proposal needs a value"),
      new AdaptiveComplaintProposalCodeLengthRule(255),
      new AdaptiveComplaintProposalAllowedLabelRule(["manual", "regional"]),
      new AdaptiveComplaintProposalCodePrefixRule("Q"),
      new AdaptiveComplaintProposalLabelLengthRule(255),
    ],
  );
}
