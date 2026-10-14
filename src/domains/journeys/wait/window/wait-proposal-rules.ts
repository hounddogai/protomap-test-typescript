import * as text from "../../../../kit/text.js";
import { WaitProposal } from "./wait-proposal.js";

/** A rule a wait proposal must pass. Check returns its problems, or none. */
export interface WaitProposalRule {
  check(item: WaitProposal): string[];
}

export class WaitProposalCodeLengthRule implements WaitProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class WaitProposalAllowedCodeRule implements WaitProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: WaitProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is blocked`];
    return [];
  }
}

export class WaitProposalRequiredCodeRule implements WaitProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: WaitProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class WaitProposalCodePrefixRule implements WaitProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: WaitProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class WaitProposalTimezoneLengthRule implements WaitProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: WaitProposal): string[] {
    const size = item.timezone.length;
    if (size > this.maxLength) return [`timezone is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

/** Runs every rule of a wait proposal. */
export class WaitProposalValidator {
  rules: WaitProposalRule[];

  constructor(rules: WaitProposalRule[]) {
    this.rules = rules;
  }

  validate(item: WaitProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: WaitProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: WaitProposal[]): Map<string, string[]> {
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

export function defaultWaitProposalValidator(): WaitProposalValidator {
  return new WaitProposalValidator(
    [
      new WaitProposalCodeLengthRule(64),
      new WaitProposalAllowedCodeRule([]),
      new WaitProposalRequiredCodeRule("wait proposal needs this field"),
      new WaitProposalCodePrefixRule("Q"),
      new WaitProposalTimezoneLengthRule(255),
    ],
  );
}
