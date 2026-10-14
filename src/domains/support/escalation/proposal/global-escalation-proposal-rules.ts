import * as text from "../../../../kit/text.js";
import { GlobalEscalationProposal } from "./global-escalation-proposal.js";

/** A rule a global escalation proposal must pass. Check returns its problems, or none. */
export interface GlobalEscalationProposalRule {
  check(item: GlobalEscalationProposal): string[];
}

export class GlobalEscalationProposalRequiredCodeRule implements GlobalEscalationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: GlobalEscalationProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class GlobalEscalationProposalAllowedCodeRule implements GlobalEscalationProposalRule {
  allowed: string[];

  constructor(allowed: string[]) {
    this.allowed = allowed;
  }

  check(item: GlobalEscalationProposal): string[] {
    if (this.allowed.length === 0) return [];
    if (!this.allowed.includes(text.normalize(item.code))) return [`code ${item.code} is inconsistent`];
    return [];
  }
}

export class GlobalEscalationProposalWindowDaysRangeRule implements GlobalEscalationProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: GlobalEscalationProposal): string[] {
    const value = item.windowDays;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`window days ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`window days ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a global escalation proposal. */
export class GlobalEscalationProposalValidator {
  rules: GlobalEscalationProposalRule[];

  constructor(rules: GlobalEscalationProposalRule[]) {
    this.rules = rules;
  }

  validate(item: GlobalEscalationProposal): string[] {
    const problems: string[] = [];
    for (const rule of this.rules) {
      for (const problem of rule.check(item)) {
        problems.push(problem);
      }
    }
    return problems;
  }

  requireValid(item: GlobalEscalationProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.label()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: GlobalEscalationProposal[]): Map<string, string[]> {
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

export function defaultGlobalEscalationProposalValidator(): GlobalEscalationProposalValidator {
  return new GlobalEscalationProposalValidator(
    [
      new GlobalEscalationProposalRequiredCodeRule("global escalation proposal needs this field"),
      new GlobalEscalationProposalAllowedCodeRule(["legacy", "batched"]),
      new GlobalEscalationProposalWindowDaysRangeRule(120, 3600),
    ],
  );
}
