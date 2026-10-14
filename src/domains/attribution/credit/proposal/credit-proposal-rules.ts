import * as text from "../../../../kit/text.js";
import { CreditProposal } from "./credit-proposal.js";

/** A rule a credit proposal must pass. Check returns its problems, or none. */
export interface CreditProposalRule {
  check(item: CreditProposal): string[];
}

export class CreditProposalRequiredNameRule implements CreditProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditProposal): string[] {
    if (item.name.trim() === "") return [this.message];
    return [];
  }
}

export class CreditProposalAllowedCodeRule implements CreditProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: CreditProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

export class CreditProposalCodePrefixRule implements CreditProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: CreditProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class CreditProposalRequiredCodeRule implements CreditProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: CreditProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a credit proposal. */
export class CreditProposalValidator {
  rules: CreditProposalRule[];

  constructor(rules: CreditProposalRule[]) {
    this.rules = rules;
  }

  validate(item: CreditProposal): string[] {
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

  requireValid(item: CreditProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: CreditProposal[]): Map<string, string[]> {
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

export function defaultCreditProposalValidator(): CreditProposalValidator {
  return new CreditProposalValidator(
    [
      new CreditProposalRequiredNameRule("credit proposal needs a value"),
      new CreditProposalAllowedCodeRule(["manual"]),
      new CreditProposalCodePrefixRule("X"),
      new CreditProposalRequiredCodeRule("credit proposal needs an entry"),
    ],
  );
}
