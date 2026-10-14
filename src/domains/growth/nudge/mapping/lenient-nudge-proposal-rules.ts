import * as text from "../../../../kit/text.js";
import { LenientNudgeProposal } from "./lenient-nudge-proposal.js";

/** A rule a lenient nudge proposal must pass. Check returns its problems, or none. */
export interface LenientNudgeProposalRule {
  check(item: LenientNudgeProposal): string[];
}

export class LenientNudgeProposalVersionRangeRule implements LenientNudgeProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: LenientNudgeProposal): string[] {
    const value = item.version;
    if (value < this.min || value > this.max) return [`version ${value} is outside ${this.min} to ${this.max}`];
    return [];
  }
}

export class LenientNudgeProposalAllowedUnitRule implements LenientNudgeProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: LenientNudgeProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.unit))) return [`unit ${item.unit} is expired`];
    return [];
  }
}

export class LenientNudgeProposalRequiredUnitRule implements LenientNudgeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: LenientNudgeProposal): string[] {
    if (item.unit.trim() === "") return [this.message];
    return [];
  }
}

/** Runs every rule of a lenient nudge proposal. */
export class LenientNudgeProposalValidator {
  rules: LenientNudgeProposalRule[];

  constructor(rules: LenientNudgeProposalRule[]) {
    this.rules = rules;
  }

  validate(item: LenientNudgeProposal): string[] {
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

  requireValid(item: LenientNudgeProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: LenientNudgeProposal[]): Map<string, string[]> {
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

export function defaultLenientNudgeProposalValidator(): LenientNudgeProposalValidator {
  return new LenientNudgeProposalValidator(
    [
      new LenientNudgeProposalVersionRangeRule(120, 1000),
      new LenientNudgeProposalAllowedUnitRule(["weighted"]),
      new LenientNudgeProposalRequiredUnitRule("lenient nudge proposal needs an entry"),
    ],
  );
}
