import * as text from "../../../../kit/text.js";
import { RedemptionProposal } from "./redemption-proposal.js";

/** A rule a redemption proposal must pass. Check returns its problems, or none. */
export interface RedemptionProposalRule {
  check(item: RedemptionProposal): string[];
}

export class RedemptionProposalRequiredNameRule implements RedemptionProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: RedemptionProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class RedemptionProposalNameLengthRule implements RedemptionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionProposalRevisionRangeRule implements RedemptionProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: RedemptionProposal): string[] {
    const value = item.revision;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`revision ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`revision ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class RedemptionProposalCodeLengthRule implements RedemptionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class RedemptionProposalAllowedNameRule implements RedemptionProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: RedemptionProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is above maximum`];
    return [];
  }
}

export class RedemptionProposalLabelLengthRule implements RedemptionProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: RedemptionProposal): string[] {
    const size = item.label.length;
    if (size > this.maxLength) return [`label is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a redemption proposal. */
export class RedemptionProposalValidator {
  rules: RedemptionProposalRule[];

  constructor(rules: RedemptionProposalRule[]) {
    this.rules = rules;
  }

  validate(item: RedemptionProposal): string[] {
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

  requireValid(item: RedemptionProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: RedemptionProposal[]): Map<string, string[]> {
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

export function defaultRedemptionProposalValidator(): RedemptionProposalValidator {
  return new RedemptionProposalValidator(
    [
      new RedemptionProposalRequiredNameRule("redemption proposal needs a value"),
      new RedemptionProposalNameLengthRule(1000),
      new RedemptionProposalRevisionRangeRule(255, 3600),
      new RedemptionProposalCodeLengthRule(1000),
      new RedemptionProposalAllowedNameRule(["tiered", "rolling"]),
      new RedemptionProposalLabelLengthRule(80),
    ],
  );
}
