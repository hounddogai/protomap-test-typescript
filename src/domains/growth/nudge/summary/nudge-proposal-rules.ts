import * as text from "../../../../kit/text.js";
import { NudgeProposal } from "./nudge-proposal.js";

/** A rule a nudge proposal must pass. Check returns its problems, or none. */
export interface NudgeProposalRule {
  check(item: NudgeProposal): string[];
}

export class NudgeProposalRequiredTitleRule implements NudgeProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: NudgeProposal): string[] {
    if (item.title.trim() === "") return [this.message];
    return [];
  }
}

export class NudgeProposalAllowedTimezoneRule implements NudgeProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: NudgeProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.timezone))) return [`timezone ${item.timezone} is out of range`];
    return [];
  }
}

export class NudgeProposalCodePrefixRule implements NudgeProposalRule {
  prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  check(item: NudgeProposal): string[] {
    if (!item.code.toUpperCase().startsWith(this.prefix.toUpperCase())) return [`code must start with ${this.prefix}`];
    return [];
  }
}

/** Runs every rule of a nudge proposal. */
export class NudgeProposalValidator {
  rules: NudgeProposalRule[];

  constructor(rules: NudgeProposalRule[]) {
    this.rules = rules;
  }

  validate(item: NudgeProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: NudgeProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: NudgeProposal[]): Map<string, string[]> {
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

export function defaultNudgeProposalValidator(): NudgeProposalValidator {
  return new NudgeProposalValidator(
    [
      new NudgeProposalRequiredTitleRule("nudge proposal needs this field"),
      new NudgeProposalAllowedTimezoneRule([]),
      new NudgeProposalCodePrefixRule("Q"),
    ],
  );
}
