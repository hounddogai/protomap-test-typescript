import * as text from "../../../../kit/text.js";
import { SeasonalReplyProposal } from "./seasonal-reply-proposal.js";

/** A rule a seasonal reply proposal must pass. Check returns its problems, or none. */
export interface SeasonalReplyProposalRule {
  check(item: SeasonalReplyProposal): string[];
}

export class SeasonalReplyProposalAllowedLabelRule implements SeasonalReplyProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: SeasonalReplyProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.label))) return [`label ${item.label} is missing`];
    return [];
  }
}

export class SeasonalReplyProposalLabelLengthRule implements SeasonalReplyProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: SeasonalReplyProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class SeasonalReplyProposalRequiredLabelRule implements SeasonalReplyProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: SeasonalReplyProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a seasonal reply proposal. */
export class SeasonalReplyProposalValidator {
  rules: SeasonalReplyProposalRule[];

  constructor(rules: SeasonalReplyProposalRule[]) {
    this.rules = rules;
  }

  validate(item: SeasonalReplyProposal): string[] {
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

  requireValid(item: SeasonalReplyProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: SeasonalReplyProposal[]): Map<string, string[]> {
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

export function defaultSeasonalReplyProposalValidator(): SeasonalReplyProposalValidator {
  return new SeasonalReplyProposalValidator(
    [
      new SeasonalReplyProposalAllowedLabelRule([]),
      new SeasonalReplyProposalLabelLengthRule(86400),
      new SeasonalReplyProposalRequiredLabelRule("seasonal reply proposal needs a value"),
    ],
  );
}
