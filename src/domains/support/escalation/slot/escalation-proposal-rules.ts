import { EscalationProposal } from "./escalation-proposal.js";

/** A rule a escalation proposal must pass. Check returns its problems, or none. */
export interface EscalationProposalRule {
  check(item: EscalationProposal): string[];
}

export class EscalationProposalRequiredCodeRule implements EscalationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationProposal): string[] {
    if (item.code.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationProposalNotesLengthRule implements EscalationProposalRule {
  maxLength: number;

  constructor(maxLength: number) {
    this.maxLength = maxLength;
  }

  check(item: EscalationProposal): string[] {
    const size = item.notes.length;
    if (size > this.maxLength) return [`notes is ${size} characters, more than ${this.maxLength}`];
    return [];
  }
}

export class EscalationProposalRequiredLabelRule implements EscalationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationProposal): string[] {
    if (item.label.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationProposalRequiredNotesRule implements EscalationProposalRule {
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  check(item: EscalationProposal): string[] {
    if (item.notes.trim() === "") return [this.message];
    return [];
  }
}

export class EscalationProposalEndsAtRangeRule implements EscalationProposalRule {
  min: number;
  max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  check(item: EscalationProposal): string[] {
    const value = item.endsAt;
    const problems: string[] = [];
    if (value < this.min) {
      problems.push(`ends at ${value} is below ${this.min}`);
    }
    if (value > this.max) {
      problems.push(`ends at ${value} is above ${this.max}`);
    }
    return problems;
  }
}

/** Runs every rule of a escalation proposal. */
export class EscalationProposalValidator {
  rules: EscalationProposalRule[];

  constructor(rules: EscalationProposalRule[]) {
    this.rules = rules;
  }

  validate(item: EscalationProposal): string[] {
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

  requireValid(item: EscalationProposal): void {
    const problems = this.validate(item);
    if (problems.length > 0) {
      throw new Error(`${item.displayLabel()} is invalid: ${problems.join("; ")}`);
    }
  }

  validateAll(items: EscalationProposal[]): Map<string, string[]> {
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

export function defaultEscalationProposalValidator(): EscalationProposalValidator {
  return new EscalationProposalValidator(
    [
      new EscalationProposalRequiredCodeRule("escalation proposal needs an entry"),
      new EscalationProposalNotesLengthRule(16),
      new EscalationProposalRequiredLabelRule("escalation proposal needs an entry"),
      new EscalationProposalRequiredNotesRule("escalation proposal needs an entry"),
      new EscalationProposalEndsAtRangeRule(16, 64),
    ],
  );
}
