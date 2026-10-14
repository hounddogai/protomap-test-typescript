import * as text from "../../../../kit/text.js";
import { PrimaryExitRuleProposal } from "./primary-exit-rule-proposal.js";

/** A rule a primary exit rule proposal must pass. Check returns its problems, or none. */
export interface PrimaryExitRuleProposalRule {
  check(item: PrimaryExitRuleProposal): string[];
}

export class PrimaryExitRuleProposalAllowedExternalRefRule implements PrimaryExitRuleProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: PrimaryExitRuleProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.externalRef))) return [`external ref ${item.externalRef} is below minimum`];
    return [];
  }
}

export class PrimaryExitRuleProposalCodeLengthRule implements PrimaryExitRuleProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryExitRuleProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryExitRuleProposalExpiresAtRangeRule implements PrimaryExitRuleProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: PrimaryExitRuleProposal): string[] {
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

export class PrimaryExitRuleProposalExternalRefLengthRule implements PrimaryExitRuleProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: PrimaryExitRuleProposal): string[] {
    const size = item.externalRef.length;
    if (size > this.maxLength) return [`external ref is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class PrimaryExitRuleProposalCodePrefixRule implements PrimaryExitRuleProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: PrimaryExitRuleProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a primary exit rule proposal. */
export class PrimaryExitRuleProposalValidator {
  rules: PrimaryExitRuleProposalRule[];

  constructor(rules: PrimaryExitRuleProposalRule[]) {
    this.rules = rules;
  }

  validate(item: PrimaryExitRuleProposal): string[] {
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

  requireValid(item: PrimaryExitRuleProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: PrimaryExitRuleProposal[]): Map<string, string[]> {
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

export function defaultPrimaryExitRuleProposalValidator(): PrimaryExitRuleProposalValidator {
  return new PrimaryExitRuleProposalValidator(
    [
      new PrimaryExitRuleProposalAllowedExternalRefRule(["lenient", "strict", "global"]),
      new PrimaryExitRuleProposalCodeLengthRule(120),
      new PrimaryExitRuleProposalExpiresAtRangeRule(16, 3600),
      new PrimaryExitRuleProposalExternalRefLengthRule(86400),
      new PrimaryExitRuleProposalCodePrefixRule("ACM"),
    ],
  );
}
