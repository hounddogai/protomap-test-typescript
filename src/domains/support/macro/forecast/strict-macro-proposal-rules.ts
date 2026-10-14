import * as text from "../../../../kit/text.js";
import { StrictMacroProposal } from "./strict-macro-proposal.js";

/** A rule a strict macro proposal must pass. Check returns its problems, or none. */
export interface StrictMacroProposalRule {
  check(item: StrictMacroProposal): string[];
}

export class StrictMacroProposalCeilingRangeRule implements StrictMacroProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: StrictMacroProposal): string[] {
    const value = item.ceiling;
    if (value < this.min || value > this.max) return [`ceiling ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class StrictMacroProposalNameLengthRule implements StrictMacroProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: StrictMacroProposal): string[] {
    const size = item.name.length;
    if (size > this.maxLength) return [`name is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class StrictMacroProposalCodePrefixRule implements StrictMacroProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: StrictMacroProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

export class StrictMacroProposalAllowedNameRule implements StrictMacroProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: StrictMacroProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.name))) return [`name ${item.name} is below minimum`];
    return [];
  }
}

/** Runs every rule of a strict macro proposal. */
export class StrictMacroProposalValidator {
  rules: StrictMacroProposalRule[];

  constructor(rules: StrictMacroProposalRule[]) {
    this.rules = rules;
  }

  validate(item: StrictMacroProposal): string[] {
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

  requireValid(item: StrictMacroProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: StrictMacroProposal[]): Map<string, string[]> {
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

export function defaultStrictMacroProposalValidator(): StrictMacroProposalValidator {
  return new StrictMacroProposalValidator(
    [
      new StrictMacroProposalCeilingRangeRule(0.4, 4989.3),
      new StrictMacroProposalNameLengthRule(80),
      new StrictMacroProposalCodePrefixRule("ACM"),
      new StrictMacroProposalAllowedNameRule(["global", "primary"]),
    ],
  );
}
