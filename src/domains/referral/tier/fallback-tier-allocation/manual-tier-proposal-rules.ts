import * as text from "../../../../kit/text.js";
import { ManualTierProposal } from "./manual-tier-proposal.js";

/** A rule a manual tier proposal must pass. Check returns its problems, or none. */
export interface ManualTierProposalRule {
  check(item: ManualTierProposal): string[];
}

export class ManualTierProposalRequiredCodeRule implements ManualTierProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTierProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTierProposalRequiredTitleRule implements ManualTierProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: ManualTierProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class ManualTierProposalCodePrefixRule implements ManualTierProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: ManualTierProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class ManualTierProposalAllowedCodeRule implements ManualTierProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: ManualTierProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is out of range`];
    return [];
  }
}

/** Runs every rule of a manual tier proposal. */
export class ManualTierProposalValidator {
  rules: ManualTierProposalRule[];

  constructor(rules: ManualTierProposalRule[]) {
    this.rules = rules;
  }

  validate(item: ManualTierProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: ManualTierProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: ManualTierProposal[]): Map<string, string[]> {
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

export function defaultManualTierProposalValidator(): ManualTierProposalValidator {
  return new ManualTierProposalValidator(
    [
      new ManualTierProposalRequiredCodeRule("manual tier proposal needs this field"),
      new ManualTierProposalRequiredTitleRule("manual tier proposal needs this field"),
      new ManualTierProposalCodePrefixRule("X"),
      new ManualTierProposalAllowedCodeRule([]),
    ],
  );
}
