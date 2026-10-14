import * as text from "../../../../kit/text.js";
import { PaywallProposal } from "./paywall-proposal.js";

/** A rule a paywall proposal must pass. Check returns its problems, or none. */
export interface PaywallProposalRule {
  check(item: PaywallProposal): string[];
}

export class PaywallProposalCodePrefixRule implements PaywallProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PaywallProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class PaywallProposalRequiredSummaryRule implements PaywallProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: PaywallProposal): string[] {
    if (item.summary.trim() === "") return [this.message];
    return [];
  }
}

export class PaywallProposalSummaryLengthRule implements PaywallProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PaywallProposal): string[] {
    const size = item.summary.length;
    if (size > this.maxLength) return [`summary is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PaywallProposalRevisionRangeRule implements PaywallProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PaywallProposal): string[] {
    const value = item.revision;
    if (value < this.min || value > this.max) return [`revision ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class PaywallProposalAllowedCodeRule implements PaywallProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PaywallProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is below minimum`];
    return [];
  }
}

/** Runs every rule of a paywall proposal. */
export class PaywallProposalValidator {
  rules: PaywallProposalRule[];

  constructor(rules: PaywallProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PaywallProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: PaywallProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PaywallProposal[]): Map<string, string[]> {
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

export function defaultPaywallProposalValidator(): PaywallProposalValidator {
  return new PaywallProposalValidator(
    [
      new PaywallProposalCodePrefixRule("Q"),
      new PaywallProposalRequiredSummaryRule("paywall proposal needs a value"),
      new PaywallProposalSummaryLengthRule(80),
      new PaywallProposalRevisionRangeRule(80, 1000),
      new PaywallProposalAllowedCodeRule([]),
    ],
  );
}
