import { CappedCreditProposal } from "./capped-credit-proposal.js";

/** A rule a capped credit proposal must pass. Check returns its problems, or none. */
export interface CappedCreditProposalRule {
  check(item: CappedCreditProposal): string[];
}

export class CappedCreditProposalCodeLengthRule implements CappedCreditProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: CappedCreditProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class CappedCreditProposalRequiredCodeRule implements CappedCreditProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreditProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCreditProposalRequiredNameRule implements CappedCreditProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreditProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CappedCreditProposalRequiredReviewerRule implements CappedCreditProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CappedCreditProposal): string[] {
    if (item.reviewer.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a capped credit proposal. */
export class CappedCreditProposalValidator {
  rules: CappedCreditProposalRule[];

  constructor(rules: CappedCreditProposalRule[]) {
    this.rules = rules;
  }

  validate(item: CappedCreditProposal): string[] {
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

  requireValid(item: CappedCreditProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CappedCreditProposal[]): Map<string, string[]> {
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

export function defaultCappedCreditProposalValidator(): CappedCreditProposalValidator {
  return new CappedCreditProposalValidator(
    [
      new CappedCreditProposalCodeLengthRule(86400),
      new CappedCreditProposalRequiredCodeRule("capped credit proposal needs a value"),
      new CappedCreditProposalRequiredNameRule("capped credit proposal needs this field"),
      new CappedCreditProposalRequiredReviewerRule("capped credit proposal needs a value"),
    ],
  );
}
