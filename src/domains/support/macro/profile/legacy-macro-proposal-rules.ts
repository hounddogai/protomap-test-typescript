import * as text from "../../../../kit/text.js";
import { LegacyMacroProposal } from "./legacy-macro-proposal.js";

/** A rule a legacy macro proposal must pass. Check returns its problems, or none. */
export interface LegacyMacroProposalRule {
  check(item: LegacyMacroProposal): string[];
}

export class LegacyMacroProposalAllowedCodeRule implements LegacyMacroProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LegacyMacroProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is stale`];
    return [];
  }
}

export class LegacyMacroProposalCodeLengthRule implements LegacyMacroProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: LegacyMacroProposal): string[] {
    const size = item.code.length;
    if (size > this.maxLength) return [`code is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class LegacyMacroProposalThresholdRangeRule implements LegacyMacroProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyMacroProposal): string[] {
    const value = item.threshold;
    if (value < this.min || value > this.max) return [`threshold ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LegacyMacroProposalScoreRangeRule implements LegacyMacroProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LegacyMacroProposal): string[] {
    const value = item.score;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`score ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`score ${value} is above ${this.max}`);
    }
    return problems;
  }
}

export class LegacyMacroProposalRequiredCodeRule implements LegacyMacroProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LegacyMacroProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a legacy macro proposal. */
export class LegacyMacroProposalValidator {
  rules: LegacyMacroProposalRule[];

  constructor(rules: LegacyMacroProposalRule[]) {
    this.rules = rules;
  }

  validate(item: LegacyMacroProposal): string[] {
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

  requireValid(item: LegacyMacroProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LegacyMacroProposal[]): Map<string, string[]> {
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

export function defaultLegacyMacroProposalValidator(): LegacyMacroProposalValidator {
  return new LegacyMacroProposalValidator(
    [
      new LegacyMacroProposalAllowedCodeRule(["batched", "scheduled", "primary"]),
      new LegacyMacroProposalCodeLengthRule(255),
      new LegacyMacroProposalThresholdRangeRule(2, 3574.2),
      new LegacyMacroProposalScoreRangeRule(0.8, 1072),
      new LegacyMacroProposalRequiredCodeRule("legacy macro proposal needs an entry"),
    ],
  );
}
